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
};

class RealtimeClient {
  private ws: WebSocket | null = null;
  private currentRoomId: string = 'real_community';
  private currentUser: UserProfile | null = null;
  private callbacks: RealtimeCallback = {};
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;

  public setCallbacks(cbs: RealtimeCallback) {
    this.callbacks = { ...this.callbacks, ...cbs };
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
          } else if (data.type === 'message') {
            this.callbacks.onMessage?.(data.roomId, data.message);
          } else if (data.type === 'presence') {
            this.callbacks.onPresence?.(data.roomId, data.count, data.users || []);
          } else if (data.type === 'typing') {
            this.callbacks.onTyping?.(data.roomId, data.userId, data.userName, data.isTyping);
          } else if (data.type === 'reaction') {
            this.callbacks.onReaction?.(data.roomId, data.messageId, data.reactions);
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
