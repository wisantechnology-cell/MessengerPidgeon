import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Crown,
  ChevronLeft,
  Maximize2,
} from 'lucide-react';
import { GroupMember } from '../types';
import { db, doc, onSnapshot, setDoc, updateDoc, addDoc, collection } from '../firebase';

interface CallModalProps {
  isOpen: boolean;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onRestore?: () => void;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
  isVideo: boolean;
  isGroup?: boolean;
  groupMembers?: GroupMember[];
  callId?: string;
  isCaller?: boolean;
  initialCallStatus?: 'calling' | 'connected';
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  isMinimized = false,
  onMinimize,
  onRestore,
  onClose,
  contactName,
  contactAvatar,
  isVideo,
  isGroup = false,
  groupMembers = [],
  callId,
  isCaller = true,
  initialCallStatus = 'calling',
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'declined'>(initialCallStatus);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(!isVideo);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [remoteVideoFrame, setRemoteVideoFrame] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const outRingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to unlock audio output on browser user interaction
  const unlockAudio = () => {
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    async function initMedia() {
      try {
        let stream: MediaStream | null = null;
        if (isVideo) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            setIsVideoOff(false);
          } catch (vidErr) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              });
              setIsVideoOff(false);
            } catch (vidErr2) {
              console.warn('Video access fallback to audio:', vidErr2);
              stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              });
              setIsVideoOff(true);
            }
          }
        } else {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
          } catch (audErr) {
            console.warn('Audio access error:', audErr);
          }
          setIsVideoOff(true);
        }

        mediaStreamRef.current = stream;

        if (hiddenLocalVideoRef.current && stream) {
          hiddenLocalVideoRef.current.srcObject = stream;
          hiddenLocalVideoRef.current.play().catch(() => {});
        }
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        // Add tracks to WebRTC peer connection if active
        if (pcRef.current && stream) {
          stream.getTracks().forEach((t) => {
            try {
              pcRef.current?.addTrack(t, stream!);
            } catch {}
          });
        }
      } catch (err) {
        console.warn('Media devices access error (camera/mic):', err);
      }
    }

    initMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, isVideo]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      const stream = mediaStreamRef.current;
      if (hiddenLocalVideoRef.current && hiddenLocalVideoRef.current.srcObject !== stream) {
        hiddenLocalVideoRef.current.srcObject = stream;
        hiddenLocalVideoRef.current.play().catch(() => {});
      }
      if (localVideoRef.current && localVideoRef.current.srcObject !== stream) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  });

  // Toggle camera video dynamically mid-call
  const toggleVideo = async () => {
    unlockAudio();
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (!nextVideoOff) {
      // Enabling camera
      try {
        let vidTrack: MediaStreamTrack | null = null;

        if (mediaStreamRef.current) {
          const vidTracks = mediaStreamRef.current.getVideoTracks();
          if (vidTracks.length > 0) {
            vidTracks.forEach((t) => (t.enabled = true));
            vidTrack = vidTracks[0];
          }
        }

        if (!vidTrack) {
          let vStream: MediaStream | null = null;
          try {
            vStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
          } catch {
            vStream = await navigator.mediaDevices.getUserMedia({ video: true });
          }

          const freshTrack = vStream.getVideoTracks()[0];
          if (freshTrack) {
            vidTrack = freshTrack;
            if (!mediaStreamRef.current) {
              mediaStreamRef.current = vStream;
            } else {
              mediaStreamRef.current.addTrack(freshTrack);
            }
          }
        }

        if (mediaStreamRef.current) {
          if (hiddenLocalVideoRef.current) {
            hiddenLocalVideoRef.current.srcObject = mediaStreamRef.current;
            hiddenLocalVideoRef.current.play().catch(() => {});
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
            localVideoRef.current.play().catch(() => {});
          }
        }

        if (pcRef.current && vidTrack && mediaStreamRef.current) {
          try {
            pcRef.current.addTrack(vidTrack, mediaStreamRef.current);
          } catch (e) {
            // track already exists
          }
        }
      } catch (err) {
        console.warn('Error enabling camera:', err);
      }
    } else {
      // Disabling camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
      }
    }
  };

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setCallDuration(0);
      setIsVideoOff(!isVideo);
      setDeclineReason(null);
      setRemoteVideoFrame(null);
      return;
    }
    setCallStatus(initialCallStatus);
  }, [isOpen, initialCallStatus, isVideo]);

  // Outgoing ringing audio when caller is waiting for receiver to pick up
  useEffect(() => {
    if (!isOpen || callStatus !== 'calling' || !isCaller) {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();

        const playTone = () => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});

          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(425, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.0);
          gain.gain.linearRampToValueAtTime(0, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.2);
        };

        playTone();
        outRingIntervalRef.current = setInterval(playTone, 3500);
      }
    } catch (e) {
      console.warn('Outgoing ring audio error:', e);
    }

    return () => {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isOpen, callStatus, isCaller]);

  // Real-time Firestore sync with calls/{callId}
  useEffect(() => {
    if (!isOpen || !callId || callId.startsWith('local_')) return;

    let hasEverExisted = false;

    const callDocRef = doc(db, 'calls', callId);
    const unsubscribe = onSnapshot(callDocRef, (snap) => {
      if (!snap.exists()) {
        if (hasEverExisted) {
          onClose();
        }
        return;
      }
      hasEverExisted = true;
      const data = snap.data();
      if (!data) return;

      if (data.status === 'accepted') {
        setCallStatus('connected');
        unlockAudio();
      } else if (data.status === 'declined') {
        setCallStatus('declined');
        setDeclineReason(`${contactName} ha rechazado la llamada.`);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else if (data.status === 'ended') {
        onClose();
      }

      const mainRemoteFrame = isCaller ? data.receiverVideoFrame : data.callerVideoFrame;
      if (mainRemoteFrame) {
        setRemoteVideoFrame(mainRemoteFrame);
      }
    }, (err) => {
      console.warn('Call snapshot error:', err);
    });

    return () => unsubscribe();
  }, [isOpen, callId, contactName, isCaller, onClose]);

  // Dedicated subcollection remote camera frame listener (calls/{callId}/frames/caller or receiver)
  useEffect(() => {
    if (!isOpen || !callId || callId.startsWith('local_')) return;

    const targetRole = isCaller ? 'receiver' : 'caller';
    const remoteFrameDocRef = doc(db, 'calls', callId, 'frames', targetRole);

    const unsubscribe = onSnapshot(remoteFrameDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.frame) {
          setRemoteVideoFrame(data.frame);
        }
      }
    }, (err) => {
      console.warn('Subcollection frame listener error:', err);
    });

    return () => unsubscribe();
  }, [isOpen, callId, isCaller]);

  // WebRTC Live Audio & Video Signaling via Firestore
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected' || !callId || callId.startsWith('local_')) return;

    let pc: RTCPeerConnection | null = null;
    let isCancelled = false;

    async function initWebRTC() {
      try {
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        });
        pcRef.current = pc;

        // Add local media tracks to peer connection
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            try {
              pc?.addTrack(track, mediaStreamRef.current!);
            } catch (e) {}
          });
        }

        // Handle remote stream & play audio/video
        pc.ontrack = (event) => {
          if (isCancelled) return;
          const incomingStream = (event.streams && event.streams[0])
            ? event.streams[0]
            : new MediaStream([event.track]);

          remoteStreamRef.current = incomingStream;

          // Dedicated unmuted audio element for incoming speaker voice
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = incomingStream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.play().catch((err) => console.warn('Audio play error:', err));
          }

          // Dedicated video element for incoming video feed
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = incomingStream;
            remoteVideoRef.current.volume = 1.0;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.play().catch((err) => console.warn('Video play error:', err));
          }
        };

        const callDocRef = doc(db, 'calls', callId);

        // ICE Candidate handling
        pc.onicecandidate = (event) => {
          if (event.candidate && callId && !callId.startsWith('local_')) {
            const subcol = isCaller ? 'callerCandidates' : 'receiverCandidates';
            addDoc(collection(db, 'calls', callId, subcol), event.candidate.toJSON()).catch(() => {});
          }
        };

        if (isCaller) {
          // Caller creates SDP Offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await updateDoc(callDocRef, {
            offer: { type: offer.type, sdp: offer.sdp },
          }).catch(() => {});

          // Listen for Answer
          const unsubDoc = onSnapshot(callDocRef, async (snap) => {
            if (snap.exists() && pc) {
              const data = snap.data();
              if (data?.answer && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {});
              }
            }
          });

          // Listen for Receiver ICE Candidates
          const unsubCandidates = onSnapshot(collection(db, 'calls', callId, 'receiverCandidates'), (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === 'added' && pc) {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
              }
            });
          });

          return () => {
            unsubDoc();
            unsubCandidates();
          };
        } else {
          // Receiver listens for Offer, creates Answer
          const unsubDoc = onSnapshot(callDocRef, async (snap) => {
            if (snap.exists() && pc) {
              const data = snap.data();
              if (data?.offer && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer)).catch(() => {});
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await updateDoc(callDocRef, {
                  answer: { type: answer.type, sdp: answer.sdp },
                }).catch(() => {});
              }
            }
          });

          // Listen for Caller ICE Candidates
          const unsubCandidates = onSnapshot(collection(db, 'calls', callId, 'callerCandidates'), (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === 'added' && pc) {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
              }
            });
          });

          return () => {
            unsubDoc();
            unsubCandidates();
          };
        }
      } catch (e) {
        console.warn('WebRTC peer connection error:', e);
      }
    }

    initWebRTC();

    return () => {
      isCancelled = true;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [isOpen, callStatus, callId, isCaller]);

  // Real-time Camera Frame Broadcaster to Firestore Subcollection calls/{callId}/frames/caller or receiver
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected' || isVideoOff || !callId || callId.startsWith('local_')) return;

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    hiddenCanvasRef.current = canvas;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const roleDocName = isCaller ? 'caller' : 'receiver';
    const frameDocRef = doc(db, 'calls', callId, 'frames', roleDocName);
    const mainDocRef = doc(db, 'calls', callId);

    const captureAndSend = () => {
      const vidSource = hiddenLocalVideoRef.current || localVideoRef.current;
      if (vidSource && ctx) {
        try {
          if (vidSource.videoWidth > 0 || vidSource.readyState >= 2) {
            ctx.drawImage(vidSource, 0, 0, 320, 240);
            const frameDataUrl = canvas.toDataURL('image/jpeg', 0.35);

            // 1. Send to dedicated frame document in subcollection
            setDoc(frameDocRef, {
              frame: frameDataUrl,
              timestamp: Date.now(),
            }, { merge: true }).catch(() => {});

            // 2. Also send to main call document as fallback
            const mainUpdate = isCaller
              ? { callerVideoFrame: frameDataUrl }
              : { receiverVideoFrame: frameDataUrl };
            setDoc(mainDocRef, mainUpdate, { merge: true }).catch(() => {});
          }
        } catch (e) {
          // ignore canvas capture errors
        }
      }
    };

    const interval = setInterval(captureAndSend, 180);
    return () => clearInterval(interval);
  }, [isOpen, callStatus, isVideoOff, callId, isCaller]);

  // Call timer - ONLY counts up when callStatus is strictly 'connected'
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  const handleHangUp = () => {
    // 1. Stop local audio and video tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    // 2. Stop remote video stream tracks
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      const stream = remoteAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      remoteAudioRef.current.srcObject = null;
    }
    // 3. Close WebRTC peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // 4. Update Firestore doc to notify other person
    if (callId && !callId.startsWith('local_')) {
      updateDoc(doc(db, 'calls', callId), { status: 'ended', endedAt: Date.now() }).catch(() => {});
    }
    // 5. Close modal completely
    onClose();
  };

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Video call is active whenever camera is NOT turned off
  const isVideoCallActive = !isVideoOff;

  // MINIMIZED FLOATING CALL BAR (Allows chatting & browsing while call stays active)
  if (isMinimized) {
    return (
      <div
        onClick={unlockAudio}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#121620]/95 border border-emerald-500/50 rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-4"
      >
        {/* Dedicated unmuted audio element for remote speaker output */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
        />

        {/* Off-screen active video element to guarantee continuous active GPU decoding & frame capture */}
        <video
          ref={hiddenLocalVideoRef}
          autoPlay
          playsInline
          muted
          className="fixed -top-[9999px] -left-[9999px] w-80 h-60 opacity-0 pointer-events-none"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="hidden"
        />

        <div className="relative">
          <img src={contactAvatar} alt={contactName} className="w-8 h-8 rounded-full object-cover border border-emerald-400" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-black" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white truncate max-w-[120px]">{contactName}</span>
          <span className="text-[10px] text-emerald-300 font-mono">
            {callStatus === 'connected' ? `Llamada • ${formatDuration(callDuration)}` : 'Conectando...'}
          </span>
        </div>

        {/* Expand / Restore Full Screen Call */}
        <button
          onClick={() => {
            unlockAudio();
            if (onRestore) onRestore();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          title="Regresar a la llamada en pantalla completa"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Ver llamada</span>
        </button>

        {/* Mic Mute Toggle */}
        <button
          onClick={() => {
            unlockAudio();
            setIsMuted(!isMuted);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isMuted ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {/* Hang Up Button (ONLY button that actually ends the call) */}
        <button
          onClick={handleHangUp}
          className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow cursor-pointer border border-red-400 active:scale-95"
          title="Colgar llamada"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={unlockAudio}
      className="fixed inset-0 z-50 bg-[#0a0e16]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto min-h-screen"
    >
      {/* Dedicated unmuted audio element for remote speaker output */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
      />

      {/* Off-screen active video element to guarantee continuous active GPU decoding & frame capture */}
      <video
        ref={hiddenLocalVideoRef}
        autoPlay
        playsInline
        muted
        className="fixed -top-[9999px] -left-[9999px] w-80 h-60 opacity-0 pointer-events-none"
      />

      {/* Top Bar matching hand-drawn sketch layout (Volver al chat + Call Info) */}
      <div className="w-full max-w-4xl flex items-center justify-between mt-2 sm:mt-4 z-20 shrink-0 px-2">
        {/* Volver al Chat button -> MINIMIZES call into floating bar without hanging up! */}
        <button
          onClick={() => {
            unlockAudio();
            if (onMinimize) onMinimize();
            else onClose();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer shadow-md group active:scale-95"
          title="Volver al chat (mantiene la llamada activa)"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-sky-400" />
          <span>Volver al chat</span>
        </button>

        {/* Status Badge & Name in Center */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider shadow-md">
            {isGroup ? <Users className="w-3.5 h-3.5" /> : isVideoCallActive ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>{isGroup ? 'Llamada Grupal' : isVideoCallActive ? 'Videollamada' : 'Llamada de Voz'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">{contactName}</h3>
        </div>

        {/* Right spacing balance */}
        <div className="flex items-center gap-2">
          {callStatus === 'calling' && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
          {callStatus === 'connected' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className={`text-xs font-medium ${callStatus === 'declined' ? 'text-red-400 font-bold' : callStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}`}>
            {callStatus === 'declined'
              ? (declineReason || 'Rechazada')
              : callStatus === 'calling'
              ? isCaller
                ? 'Llamando...'
                : 'Conectando...'
              : formatDuration(callDuration)}
          </span>
        </div>
      </div>

      {/* Main Area: Video feed ("La de mi amigo") with TOP-RIGHT Local Camera PIP ("Mi cámara") */}
      <div className="relative flex items-center justify-center my-auto w-full max-w-4xl px-2 sm:px-4 z-10 shrink-0 min-h-0">
        {isGroup ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full py-4">
            <div className="relative flex flex-col items-center p-3 rounded-2xl bg-[#141822]/80 border border-white/10 shadow-xl">
              <img
                src={contactAvatar}
                alt={contactName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-500 shadow-md mb-2"
              />
              <span className="text-xs font-bold text-white truncate max-w-[120px]">{contactName}</span>
              <span className="text-[10px] text-purple-400 font-semibold">Grupo Principal</span>
            </div>

            {groupMembers.map((member) => (
              <div
                key={member.id}
                className="relative flex flex-col items-center p-3 rounded-2xl bg-[#141822]/80 border border-white/10 shadow-xl"
              >
                <div className="relative">
                  {callStatus === 'connected' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#141822]" />
                  )}
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-500 shadow-md mb-2"
                  />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{member.name}</span>
                <span className="text-[10px] text-[#8d90a0]">
                  {member.isLeader ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                      <Crown className="w-3 h-3 fill-amber-400" /> Líder
                    </span>
                  ) : (
                    'Integrante'
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : isVideoCallActive ? (
          <div className="relative w-full max-w-3xl h-[340px] sm:h-[480px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-[#141822] flex items-center justify-center my-2">
            {/* Main Full-Screen Video Area: Remote Friend Camera ("La de mi amigo") */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover absolute inset-0 z-0"
            />

            {/* Firestore real-time frame snapshot sync (Works exactly like chat messages subcollection streaming!) */}
            {remoteVideoFrame ? (
              <img
                src={remoteVideoFrame}
                alt={contactName}
                className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
              />
            ) : (
              callStatus === 'connected' && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/60 to-purple-950/60 pointer-events-none">
                  <img
                    src={contactAvatar}
                    alt={contactName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-emerald-500/80 shadow-2xl mb-3 animate-pulse"
                  />
                  <span className="text-base sm:text-lg font-bold text-white tracking-wide">{contactName}</span>
                </div>
              )
            )}

            {!remoteVideoFrame && callStatus === 'calling' && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/80 flex flex-col items-center justify-center z-10">
                <img
                  src={contactAvatar}
                  alt={contactName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-500/80 shadow-2xl mb-3 animate-pulse"
                />
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">{contactName}</span>
              </div>
            )}

            {/* TOP-RIGHT Local Camera Preview PIP ("Mi cámara" box from hand-drawn sketch) */}
            <div className="absolute top-4 right-4 w-32 sm:w-40 h-24 sm:h-32 rounded-2xl bg-[#1c2028] border-2 border-white/40 shadow-2xl overflow-hidden flex flex-col items-center justify-center z-30">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-extrabold text-white shadow border border-white/20">
                Tú
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center py-6">
            {/* Hidden remoteVideoRef element for audio playback in voice mode */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="hidden"
            />
            {callStatus === 'calling' && (
              <div className="absolute -inset-8 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            )}
            {callStatus === 'connected' && (
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse" />
            )}
            <img
              src={contactAvatar}
              alt={contactName}
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 shadow-2xl relative z-10 transition-all ${
                callStatus === 'connected' ? 'border-emerald-500 scale-105' : 'border-[#2563eb]'
              }`}
            />
          </div>
        )}
      </div>

      {/* Controls Bar - Matching Skitched Layout (Mic, Phone Hang Up, Video Toggle) */}
      <div className="sticky bottom-2 sm:bottom-4 flex items-center justify-center gap-4 sm:gap-6 bg-[#1c2028]/95 px-6 py-3 rounded-full border border-white/20 backdrop-blur-2xl shadow-2xl z-50 mt-auto shrink-0">
        <button
          onClick={() => {
            unlockAudio();
            setIsMuted(!isMuted);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#262a33] text-white hover:bg-[#31353e]'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleHangUp}
          className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/50 cursor-pointer border-2 border-red-400"
          title="Colgar llamada"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoOff
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-[#262a33] text-emerald-400 hover:bg-[#31353e] border border-emerald-500/30'
          }`}
          title={isVideoOff ? 'Activar cámara (Videollamada)' : 'Desactivar cámara'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
