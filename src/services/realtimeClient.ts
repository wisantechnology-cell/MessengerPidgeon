import { Message, UserProfile } from '../types';

export interface RealtimePresenceUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type RealtimeCallback = {
  onMessage?: (roomId: string, message: Message) => void;
  onPresence?: (roomId: string, count: number, users: RealtimePresenceUser[]) => void;
  onTyping?: (roomId: string, userId: string, userName: string, isTyping: boolean) => void;
  onReaction?: (roomId: string, messageId: string, reactions: Record<string, number>) => void;
  onHistory?: (roomId: string, messages: Message[]) => void;
  onStatusChange?: (connected: boolean) => void;
  onCallSignal?: (callId: string, signal: any, senderId: string) => void;
  onCallFrame?: (callId: string, frame: string, role: string, senderId: string) => void;
  onCallAudio?: (callId: string, audio: string, role: string, senderId: string) => void;
  onRoom3dState?: (roomId: string, config: any, avatars: Record<string, any>) => void;
  onGameEvent?: (roomId: string, event: { gameType: string; action: string; payload?: any; gameState?: any; senderId: string; senderName: string }) => void;
};

class RealtimeClient {
  private ws: WebSocket | null = null;
  private currentRoomId: string = 'real_community';
  private currentUser: UserProfile | null = null;
  private callbacks: RealtimeCallback = {};
  private room3dListeners = new Set<(roomId: string, config: any, avatars: Record<string, any>) => void>();
  private gameListeners = new Set<(roomId: string, event: any) => void>();
  private reconnectTimer: any = null;
  private activeCallRooms: Set<string> = new Set<string>();
  private pendingCallSignals: { callId: string; signal: any }[] = [];
  private isExplicitlyClosed: boolean = false;

  public setCallbacks(cbs: RealtimeCallback) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  public subscribeRoom3d(fn: (roomId: string, config: any, avatars: Record<string, any>) => void): () => void {
    this.room3dListeners.add(fn);
    return () => {
      this.room3dListeners.delete(fn);
    };
  }

  public subscribeGame(fn: (roomId: string, event: any) => void): () => void {
    this.gameListeners.add(fn);
    return () => {
      this.gameListeners.delete(fn);
    };
  }

  public ensureConnected(user?: UserProfile) {
    if (user) {
      this.currentUser = user;
    }
    if (!this.currentUser) {
      const storedUid = typeof localStorage !== 'undefined' ? (localStorage.getItem('birdmessage_client_uid') || `user_${Date.now()}`) : `user_${Date.now()}`;
      this.currentUser = {
        id: storedUid,
        name: 'Usuario PidgeX',
        phone: '16 612 000 000',
        avatarUrl: '',
      } as any;
    }
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.initWebSocket();
    }
  }

  public connect(user: UserProfile, roomId: string = 'real_community') {
    this.currentUser = user;
    this.currentRoomId = roomId;
    this.isExplicitlyClosed = false;

    // First, fetch history via REST for immediate rendering
    this.fetchRoomHistory(roomId);

    this.initWebSocket();
  }

  private initWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.joinRoom(this.currentRoomId);
        this.activeCallRooms.forEach((cId) => this.sendJoinRoomPayload(`call_${cId}`));
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.callbacks.onStatusChange?.(true);
        this.joinRoom(this.currentRoomId);
        this.activeCallRooms.forEach((cId) => this.sendJoinRoomPayload(`call_${cId}`));
        while (this.pendingCallSignals.length > 0) {
          const item = this.pendingCallSignals.shift();
          if (item && this.activeCallRooms.has(item.callId)) {
            this.sendCallSignal(item.callId, item.signal);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            if (data.messages && Array.isArray(data.messages)) {
              this.callbacks.onHistory?.(data.roomId, data.messages);
            }
            if (data.users) {
              this.callbacks.onPresence?.(data.roomId, data.users.length, data.users);
            }
            if (data.room3dState) {
              this.callbacks.onRoom3dState?.(data.roomId, data.room3dState.config, data.room3dState.avatars || {});
              this.room3dListeners.forEach((fn) => fn(data.roomId, data.room3dState.config, data.room3dState.avatars || {}));
            }
            if (data.gameState) {
              const evt = {
                gameType: data.gameState.gameType,
                action: 'sync',
                gameState: data.gameState,
                senderId: 'server',
                senderName: 'Sistema',
              };
              this.callbacks.onGameEvent?.(data.roomId, evt);
              this.gameListeners.forEach((fn) => fn(data.roomId, evt));
            }
          } else if (data.type === 'message') {
            this.callbacks.onMessage?.(data.roomId, data.message);
          } else if (data.type === 'presence') {
            this.callbacks.onPresence?.(data.roomId, data.count, data.users || []);
          } else if (data.type === 'typing') {
            this.callbacks.onTyping?.(data.roomId, data.userId, data.userName, data.isTyping);
          } else if (data.type === 'reaction') {
            this.callbacks.onReaction?.(data.roomId, data.messageId, data.reactions);
          } else if (data.type === 'room_3d_state') {
            this.callbacks.onRoom3dState?.(data.roomId, data.config, data.avatars || {});
            this.room3dListeners.forEach((fn) => fn(data.roomId, data.config, data.avatars || {}));
          } else if (data.type === 'game_event') {
            this.callbacks.onGameEvent?.(data.roomId, data);
            this.gameListeners.forEach((fn) => fn(data.roomId, data));
          } else if (data.type === 'call_signal') {
            this.callbacks.onCallSignal?.(data.callId, data.signal, data.senderId);
          } else if (data.type === 'call_frame') {
            this.callbacks.onCallFrame?.(data.callId, data.frame, data.role, data.senderId);
          } else if (data.type === 'call_audio') {
            this.callbacks.onCallAudio?.(data.callId, data.audio, data.role, data.senderId);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.callbacks.onStatusChange?.(false);
        if (!this.isExplicitlyClosed) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.initWebSocket();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WS connection warning:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('Failed to initialize WebSocket:', e);
    }
  }

  public joinRoom(roomId: string) {
    this.currentRoomId = roomId;
    this.fetchRoomHistory(roomId);

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
      this.ws.send(
        JSON.stringify({
          type: 'join',
          roomId,
          user: {
            id: this.currentUser.id,
            name: this.currentUser.name,
            avatarUrl: this.currentUser.avatarUrl,
          },
        })
      );
    }
  }

  public async fetchRoomHistory(roomId: string) {
    try {
      const res = await fetch(`/api/realtime/room/${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          this.callbacks.onHistory?.(roomId, data.messages);
        }
        if (data.users) {
          this.callbacks.onPresence?.(roomId, data.onlineCount || data.users.length, data.users);
        }
      }
    } catch (e) {
      console.warn('Error fetching room history via REST:', e);
    }
  }

  public sendMessage(roomId: string, message: Message) {
    // Send via WebSocket if available
    let sentViaWs = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'message',
            roomId,
            message,
          })
        );
        sentViaWs = true;
      } catch (err) {
        console.warn('WS send failed, will use HTTP fallback:', err);
      }
    }

    // Always ensure delivery to backend via HTTP if WS wasn't open
    if (!sentViaWs) {
      fetch(`/api/realtime/room/${encodeURIComponent(roomId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }).catch((e) => console.error('REST message send failed:', e));
    }
  }

  public sendTyping(roomId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'typing',
            roomId,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            isTyping,
          })
        );
      } catch (e) {
        // silent
      }
    }
  }

  public updateUserName(name: string) {
    if (this.currentUser) {
      this.currentUser.name = name;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.joinRoom(this.currentRoomId);
      }
    }
  }

  public sendReaction(roomId: string, messageId: string, emoji: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'reaction',
            roomId,
            messageId,
            emoji,
          })
        );
      } catch (e) {
        // silent
      }
    }
  }

  private sendJoinRoomPayload(roomId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'join',
            roomId,
            user: {
              id: this.currentUser.id,
              name: this.currentUser.name,
              avatarUrl: this.currentUser.avatarUrl,
            },
          })
        );
      } catch (e) {
        console.warn('Failed to send join room payload:', e);
      }
    }
  }

  public joinCallRoom(callId: string) {
    const roomId = `call_${callId}`;
    this.activeCallRooms.add(callId);
    this.ensureConnected();
    this.sendJoinRoomPayload(roomId);
  }

  public leaveCallRoom(callId: string) {
    this.activeCallRooms.delete(callId);
    const roomId = `call_${callId}`;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'leave',
            roomId,
          })
        );
      } catch (e) {
        // silent
      }
    }
  }

  public sendCallSignal(callId: string, signal: any) {
    const roomId = `call_${callId}`;
    this.ensureConnected();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'call_signal',
            roomId,
            callId,
            signal,
          })
        );
      } catch (e) {
        console.warn('Failed to send call signal:', e);
      }
    } else {
      if (this.pendingCallSignals.length > 40) {
        this.pendingCallSignals.shift();
      }
      this.pendingCallSignals.push({ callId, signal });
    }
  }

  public sendCallFrame(callId: string, frame: string, role: string) {
    const roomId = `call_${callId}`;
    this.ensureConnected();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'call_frame',
            roomId,
            callId,
            frame,
            role,
          })
        );
      } catch (e) {
        // frame drop is acceptable
      }
    }
  }

  public sendCallAudio(callId: string, audio: string, role: string) {
    const roomId = `call_${callId}`;
    this.ensureConnected();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'call_audio',
            roomId,
            callId,
            audio,
            role,
          })
        );
      } catch (e) {
        // audio drop
      }
    }
  }

  public sendRoom3dUpdate(roomId: string, data: { avatarState?: any; roomConfig?: any }) {
    this.ensureConnected();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'room_3d_update',
            roomId,
            ...data,
          })
        );
      } catch (e) {
        // silent
      }
    }
  }

  public sendGameEvent(roomId: string, event: { gameType: string; action: string; payload?: any; gameState?: any }) {
    this.ensureConnected();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'game_event',
            roomId,
            ...event,
          })
        );
      } catch (e) {
        // silent
      }
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();
