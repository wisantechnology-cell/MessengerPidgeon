import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Volume2,
} from 'lucide-react';
import { GroupMember } from '../types';
import { db, doc, onSnapshot, updateDoc, addDoc, collection, setDoc } from '../firebase';
import { realtimeClient } from '../services/realtimeClient';

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
  const [hasWebRtcVideo, setHasWebRtcVideo] = useState<boolean>(false);
  const [audioNeedsUnlock, setAudioNeedsUnlock] = useState<boolean>(false);

  // References
  const outRingCtxRef = useRef<AudioContext | null>(null);
  const outRingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Direct Audio Contexts for Hardware Sound Output
  const txAudioCtxRef = useRef<AudioContext | null>(null);
  const txProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const rxAudioCtxRef = useRef<AudioContext | null>(null);
  const webrtcAudioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSetRef = useRef<boolean>(false);

  const myRole = isCaller ? 'caller' : 'receiver';

  // Keep isMutedRef in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Keep isVideoOff in sync with video tracks
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  // Unlock browser audio upon user click or tap
  const unlockAudio = useCallback(() => {
    setAudioNeedsUnlock(false);

    if (rxAudioCtxRef.current && rxAudioCtxRef.current.state === 'suspended') {
      rxAudioCtxRef.current.resume().catch(() => {});
    }
    if (txAudioCtxRef.current && txAudioCtxRef.current.state === 'suspended') {
      txAudioCtxRef.current.resume().catch(() => {});
    }
    if (webrtcAudioCtxRef.current && webrtcAudioCtxRef.current.state === 'suspended') {
      webrtcAudioCtxRef.current.resume().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // 1. Join realtime call room on mount, clean up on unmount
  useEffect(() => {
    if (!isOpen || !callId) return;

    realtimeClient.joinCallRoom(callId);

    return () => {
      realtimeClient.leaveCallRoom(callId);
    };
  }, [isOpen, callId]);

  // 2. Play receiving audio chunks seamlessly through Rx AudioContext
  const handleIncomingAudioChunk = useCallback((audioB64: string) => {
    try {
      if (!rxAudioCtxRef.current || rxAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          rxAudioCtxRef.current = new AudioCtx();
        }
      }

      const rxCtx = rxAudioCtxRef.current;
      if (!rxCtx) return;

      if (rxCtx.state === 'suspended') {
        setAudioNeedsUnlock(true);
        rxCtx.resume().catch(() => {});
      }

      // Decode base64 to binary string -> Int16Array -> Float32Array
      const binaryStr = atob(audioB64);
      const byteLen = binaryStr.length;
      const u8 = new Uint8Array(byteLen);
      for (let i = 0; i < byteLen; i++) {
        u8[i] = binaryStr.charCodeAt(i);
      }
      const pcm16 = new Int16Array(u8.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = rxCtx.createBuffer(1, float32.length, 12000);
      audioBuffer.getChannelData(0).set(float32);

      const bufferSource = rxCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(rxCtx.destination);

      const now = rxCtx.currentTime;
      if (nextPlayTimeRef.current < now || nextPlayTimeRef.current > now + 0.3) {
        nextPlayTimeRef.current = now + 0.03; // 30ms jitter buffer
      }
      bufferSource.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
    } catch {
      // ignore corrupted chunk
    }
  }, []);

  // 3. Register WebSocket real-time call callbacks (signal, frame, audio)
  useEffect(() => {
    if (!isOpen || !callId) return;

    realtimeClient.setCallbacks({
      onCallSignal: async (incomingCallId, signal) => {
        if (incomingCallId !== callId) return;
        const pc = pcRef.current;
        if (!pc) return;

        try {
          if (signal.type === 'offer' && !isCaller) {
            if (!isRemoteDescriptionSetRef.current) {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.desc));
              isRemoteDescriptionSetRef.current = true;
              while (candidateQueueRef.current.length > 0) {
                const c = candidateQueueRef.current.shift();
                if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              realtimeClient.sendCallSignal(callId, { type: 'answer', desc: { type: answer.type, sdp: answer.sdp } });
            }
          } else if (signal.type === 'answer' && isCaller) {
            if (!isRemoteDescriptionSetRef.current) {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.desc));
              isRemoteDescriptionSetRef.current = true;
              while (candidateQueueRef.current.length > 0) {
                const c = candidateQueueRef.current.shift();
                if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
            }
          } else if (signal.type === 'candidate' && signal.candidate) {
            if (isRemoteDescriptionSetRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
            } else {
              candidateQueueRef.current.push(signal.candidate);
            }
          }
        } catch (e) {
          console.warn('WS call signal handle error:', e);
        }
      },
      onCallFrame: (incomingCallId, frame) => {
        if (incomingCallId === callId) {
          setRemoteVideoFrame(frame);
        }
      },
      onCallAudio: (incomingCallId, audioB64) => {
        if (incomingCallId === callId) {
          handleIncomingAudioChunk(audioB64);
        }
      },
    });
  }, [isOpen, callId, isCaller, handleIncomingAudioChunk]);

  // 4. Request user media (Microphone + Camera) immediately upon opening
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initMedia() {
      try {
        let stream: MediaStream | null = null;
        if (isVideo) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            setIsVideoOff(false);
          } catch {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              });
              setIsVideoOff(false);
            } catch {
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
          } catch (e) {
            console.warn('Microphone permission warning:', e);
          }
          setIsVideoOff(true);
        }

        if (!isMounted) {
          if (stream) stream.getTracks().forEach((t) => t.stop());
          return;
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
      } catch (err) {
        console.warn('Failed to access media devices:', err);
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, isVideo]);

  // 5. Connect local mic audio stream to WebSocket live transmitter (Tx Audio)
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected' || !callId) return;

    let localCtx: AudioContext | null = null;
    let processor: ScriptProcessorNode | null = null;
    let micSource: MediaStreamAudioSourceNode | null = null;
    let silentGain: GainNode | null = null;

    try {
      const stream = mediaStreamRef.current;
      if (!stream || stream.getAudioTracks().length === 0) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        localCtx = new AudioCtx();
        txAudioCtxRef.current = localCtx;

        micSource = localCtx.createMediaStreamSource(stream);
        processor = localCtx.createScriptProcessor(2048, 1, 1);
        txProcessorRef.current = processor;

        const inputRate = localCtx.sampleRate || 44100;
        const targetRate = 12000;
        const ratio = inputRate / targetRate;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return;
          const input = e.inputBuffer.getChannelData(0);

          // Fast downsample to 12kHz
          const outLength = Math.floor(input.length / ratio);
          const pcm16 = new Int16Array(outLength);

          for (let i = 0; i < outLength; i++) {
            const srcIdx = Math.floor(i * ratio);
            const s = Math.max(-1, Math.min(1, input[srcIdx]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          const u8 = new Uint8Array(pcm16.buffer);
          const chunkSize = 4096;
          let binary = '';
          for (let i = 0; i < u8.byteLength; i += chunkSize) {
            const chunk = u8.subarray(i, Math.min(i + chunkSize, u8.byteLength));
            binary += String.fromCharCode.apply(null, chunk as any);
          }
          const b64 = btoa(binary);
          realtimeClient.sendCallAudio(callId, b64, myRole);
        };

        silentGain = localCtx.createGain();
        silentGain.gain.setValueAtTime(0, localCtx.currentTime);

        micSource.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(localCtx.destination);
      }
    } catch (e) {
      console.warn('Audio transmitter setup notice:', e);
    }

    return () => {
      if (processor) processor.disconnect();
      if (micSource) micSource.disconnect();
      if (silentGain) silentGain.disconnect();
      if (localCtx) localCtx.close().catch(() => {});
      txProcessorRef.current = null;
      txAudioCtxRef.current = null;
    };
  }, [isOpen, callStatus, callId, myRole]);

  // 6. Camera Frame Broadcaster via WebSocket (smooth 16 FPS fallback)
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected' || isVideoOff || !callId) return;

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    hiddenCanvasRef.current = canvas;
    canvas.width = 280;
    canvas.height = 210;
    const ctx = canvas.getContext('2d');

    let isBroadcasting = true;

    const captureAndSend = () => {
      if (!isBroadcasting) return;
      const vidSource = hiddenLocalVideoRef.current || localVideoRef.current;
      if (vidSource && ctx) {
        try {
          if (vidSource.videoWidth > 0 || vidSource.readyState >= 2) {
            ctx.drawImage(vidSource, 0, 0, 280, 210);
            const frameDataUrl = canvas.toDataURL('image/jpeg', 0.35);
            realtimeClient.sendCallFrame(callId, frameDataUrl, myRole);
          }
        } catch {
          // ignore canvas capture frame drops
        }
      }
    };

    const interval = setInterval(captureAndSend, 65);

    // Also send occasional frame to Firestore doc as fallback
    const firestoreInterval = setInterval(() => {
      if (!isBroadcasting || !callId || callId.startsWith('local_')) return;
      const vidSource = hiddenLocalVideoRef.current || localVideoRef.current;
      if (vidSource && ctx && (vidSource.videoWidth > 0 || vidSource.readyState >= 2)) {
        try {
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.25);
          const update = isCaller
            ? { callerVideoFrame: frameDataUrl, remoteVideoFrame: frameDataUrl }
            : { receiverVideoFrame: frameDataUrl, remoteVideoFrame: frameDataUrl };
          setDoc(doc(db, 'calls', callId), update, { merge: true }).catch(() => {});
        } catch {}
      }
    }, 1500);

    return () => {
      isBroadcasting = false;
      clearInterval(interval);
      clearInterval(firestoreInterval);
    };
  }, [isOpen, callStatus, isVideoOff, callId, myRole, isCaller]);

  // 7. WebRTC Peer Connection with Hardware Video/Audio Decoding & Dual Signaling
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected' || !callId || callId.startsWith('local_')) return;

    let pc: RTCPeerConnection | null = null;
    let isCancelled = false;
    isRemoteDescriptionSetRef.current = false;
    candidateQueueRef.current = [];

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

        // Add local media tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            try {
              pc?.addTrack(track, mediaStreamRef.current!);
            } catch {}
          });
        }

        // Incoming remote WebRTC media tracks (Hardware smooth 30-60 FPS)
        pc.ontrack = (event) => {
          if (isCancelled) return;
          const incomingStream = (event.streams && event.streams[0])
            ? event.streams[0]
            : new MediaStream([event.track]);

          // Handle Video Track
          if (event.track.kind === 'video' || incomingStream.getVideoTracks().length > 0) {
            setHasWebRtcVideo(true);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = incomingStream;
              remoteVideoRef.current.volume = 1.0;
              remoteVideoRef.current.muted = false;
              remoteVideoRef.current.play().catch(() => {});
            }
          }

          // Handle Audio Track
          if (event.track.kind === 'audio' || incomingStream.getAudioTracks().length > 0) {
            // 1. Element playback
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = incomingStream;
              remoteAudioRef.current.volume = 1.0;
              remoteAudioRef.current.muted = false;
              remoteAudioRef.current.play().catch(() => {
                setAudioNeedsUnlock(true);
              });
            }

            // 2. Hardware speaker pipe through Web Audio API for unblockable sound
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                if (!webrtcAudioCtxRef.current || webrtcAudioCtxRef.current.state === 'closed') {
                  webrtcAudioCtxRef.current = new AudioCtx();
                }
                const actx = webrtcAudioCtxRef.current;
                if (actx.state === 'suspended') actx.resume().catch(() => {});
                const src = actx.createMediaStreamSource(incomingStream);
                src.connect(actx.destination);
              }
            } catch (err) {
              console.warn('Audio pipe notice:', err);
            }
          }
        };

        const callDocRef = doc(db, 'calls', callId);

        // ICE Candidate dispatch
        pc.onicecandidate = (event) => {
          if (event.candidate && callId) {
            const candidateJSON = event.candidate.toJSON();
            // 1. Send via WebSocket
            realtimeClient.sendCallSignal(callId, { type: 'candidate', candidate: candidateJSON });
            // 2. Also send via Firestore
            if (!callId.startsWith('local_')) {
              const subcol = isCaller ? 'callerCandidates' : 'receiverCandidates';
              addDoc(collection(db, 'calls', callId, subcol), candidateJSON).catch(() => {});
            }
          }
        };

        if (isCaller) {
          // Caller creates SDP Offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: isVideo,
          });
          await pc.setLocalDescription(offer);

          // Broadcast offer via WebSocket & Firestore
          realtimeClient.sendCallSignal(callId, { type: 'offer', desc: { type: offer.type, sdp: offer.sdp } });
          await updateDoc(callDocRef, {
            offer: { type: offer.type, sdp: offer.sdp },
          }).catch(() => {});

          // Firestore answer listener
          const unsubDoc = onSnapshot(callDocRef, async (snap) => {
            if (snap.exists() && pc && !isRemoteDescriptionSetRef.current) {
              const data = snap.data();
              if (data?.answer) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {});
                isRemoteDescriptionSetRef.current = true;
                while (candidateQueueRef.current.length > 0) {
                  const c = candidateQueueRef.current.shift();
                  if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
              }
            }
          });

          // Firestore ICE candidates listener
          const unsubCandidates = onSnapshot(collection(db, 'calls', callId, 'receiverCandidates'), (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === 'added' && pc) {
                const candData = change.doc.data() as RTCIceCandidateInit;
                if (isRemoteDescriptionSetRef.current) {
                  await pc.addIceCandidate(new RTCIceCandidate(candData)).catch(() => {});
                } else {
                  candidateQueueRef.current.push(candData);
                }
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
            if (snap.exists() && pc && !isRemoteDescriptionSetRef.current) {
              const data = snap.data();
              if (data?.offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer)).catch(() => {});
                isRemoteDescriptionSetRef.current = true;
                while (candidateQueueRef.current.length > 0) {
                  const c = candidateQueueRef.current.shift();
                  if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                realtimeClient.sendCallSignal(callId, { type: 'answer', desc: { type: answer.type, sdp: answer.sdp } });
                await updateDoc(callDocRef, {
                  answer: { type: answer.type, sdp: answer.sdp },
                }).catch(() => {});
              }
            }
          });

          // Firestore caller candidates listener
          const unsubCandidates = onSnapshot(collection(db, 'calls', callId, 'callerCandidates'), (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === 'added' && pc) {
                const candData = change.doc.data() as RTCIceCandidateInit;
                if (isRemoteDescriptionSetRef.current) {
                  await pc.addIceCandidate(new RTCIceCandidate(candData)).catch(() => {});
                } else {
                  candidateQueueRef.current.push(candData);
                }
              }
            });
          });

          return () => {
            unsubDoc();
            unsubCandidates();
          };
        }
      } catch (e) {
        console.warn('WebRTC initialization warning:', e);
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
  }, [isOpen, callStatus, callId, isCaller, isVideo]);

  // 8. Outgoing call ringing audio for caller
  useEffect(() => {
    if (!isOpen || callStatus !== 'calling' || !isCaller) {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (outRingCtxRef.current) {
        outRingCtxRef.current.close().catch(() => {});
        outRingCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        outRingCtxRef.current = new AudioCtx();

        const playTone = () => {
          if (!outRingCtxRef.current) return;
          const ctx = outRingCtxRef.current;
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
      console.warn('Outgoing ring tone error:', e);
    }

    return () => {
      if (outRingIntervalRef.current) clearInterval(outRingIntervalRef.current);
      if (outRingCtxRef.current) {
        outRingCtxRef.current.close().catch(() => {});
        outRingCtxRef.current = null;
      }
    };
  }, [isOpen, callStatus, isCaller]);

  // 9. Firestore Call Status Sync
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

      const mainRemoteFrame = isCaller
        ? (data.receiverVideoFrame || data.remoteVideoFrame)
        : (data.callerVideoFrame || data.remoteVideoFrame);
      if (mainRemoteFrame) {
        setRemoteVideoFrame(mainRemoteFrame);
      }
    }, (err) => {
      console.warn('Call snapshot error:', err);
    });

    return () => unsubscribe();
  }, [isOpen, callId, contactName, isCaller, onClose, unlockAudio]);

  // 10. Call duration timer (strictly when connected)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  // Toggle video mid-call
  const toggleVideo = async () => {
    unlockAudio();
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (!nextVideoOff) {
      try {
        let vidTrack: MediaStreamTrack | null = null;
        if (mediaStreamRef.current) {
          const tracks = mediaStreamRef.current.getVideoTracks();
          if (tracks.length > 0) {
            tracks.forEach((t) => (t.enabled = true));
            vidTrack = tracks[0];
          }
        }

        if (!vidTrack) {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          });
          const freshTrack = vStream.getVideoTracks()[0];
          if (freshTrack) {
            vidTrack = freshTrack;
            if (mediaStreamRef.current) {
              mediaStreamRef.current.addTrack(freshTrack);
            } else {
              mediaStreamRef.current = vStream;
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
          } catch {}
        }
      } catch (err) {
        console.warn('Camera toggle error:', err);
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
      }
    }
  };

  const handleHangUp = () => {
    // 1. Leave WS call room
    if (callId) {
      realtimeClient.leaveCallRoom(callId);
    }
    // 2. Stop local tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    // 3. Clear video element sources
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (hiddenLocalVideoRef.current) hiddenLocalVideoRef.current.srcObject = null;
    // 4. Close WebRTC
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // 5. Clean up audio contexts and video states
    if (rxAudioCtxRef.current && rxAudioCtxRef.current.state !== 'closed') {
      rxAudioCtxRef.current.close().catch(() => {});
      rxAudioCtxRef.current = null;
    }
    if (txAudioCtxRef.current && txAudioCtxRef.current.state !== 'closed') {
      txAudioCtxRef.current.close().catch(() => {});
      txAudioCtxRef.current = null;
    }
    if (webrtcAudioCtxRef.current && webrtcAudioCtxRef.current.state !== 'closed') {
      webrtcAudioCtxRef.current.close().catch(() => {});
      webrtcAudioCtxRef.current = null;
    }
    setHasWebRtcVideo(false);
    setRemoteVideoFrame(null);

    // 6. Update Firestore
    if (callId && !callId.startsWith('local_')) {
      updateDoc(doc(db, 'calls', callId), { status: 'ended', endedAt: Date.now() }).catch(() => {});
    }
    onClose();
  };

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVideoCallActive = !isVideoOff;

  // MINIMIZED CALL BAR
  if (isMinimized) {
    return (
      <div
        onClick={unlockAudio}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#121620]/95 border border-emerald-500/50 rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-4"
      >
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}
        />
        <video ref={hiddenLocalVideoRef} autoPlay playsInline muted style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }} />

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

        <button
          onClick={() => {
            unlockAudio();
            if (onRestore) onRestore();
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
          title="Ver llamada"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Ver</span>
        </button>

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
      onTouchStart={unlockAudio}
      className="fixed inset-0 z-50 bg-[#0a0e16]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto min-h-screen"
    >
      {/* Off-screen audio element with real non-zero dimensions to prevent browser power-saving audio cut */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}
      />
      <video
        ref={hiddenLocalVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}
      />

      {/* Audio Unlock Warning Banner if browser requires user gesture */}
      {audioNeedsUnlock && (
        <div
          onClick={unlockAudio}
          className="w-full max-w-md mx-auto mb-2 py-2 px-4 rounded-full bg-emerald-500/95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce cursor-pointer z-30 border border-white/30"
        >
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>🔊 Toca aquí para activar el altavoz de la llamada</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mt-2 sm:mt-4 z-20 shrink-0 px-2">
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

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider shadow-md">
            {isGroup ? <Users className="w-3.5 h-3.5" /> : isVideoCallActive ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            <span>{isGroup ? 'Llamada Grupal' : isVideoCallActive ? 'Videollamada' : 'Llamada de Voz'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">{contactName}</h3>
        </div>

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

      {/* Main Area: Remote Video ("La de mi amigo/mamá") with TOP-RIGHT Local Camera PIP ("Mi cámara") */}
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
            {/* Primary Remote Feed: WebRTC Video element (Hardware 30-60 FPS Fluid Video) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${
                hasWebRtcVideo ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />

            {/* Instant WebSocket Remote Video Frame Layer (Shows friend/mother camera fluidly while WebRTC connects) */}
            {!hasWebRtcVideo && remoteVideoFrame ? (
              <img
                src={remoteVideoFrame}
                alt={contactName}
                className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
              />
            ) : !hasWebRtcVideo ? (
              callStatus === 'connected' ? (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/60 to-purple-950/60 pointer-events-none">
                  <img
                    src={contactAvatar}
                    alt={contactName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-emerald-500/80 shadow-2xl mb-3 animate-pulse"
                  />
                  <span className="text-base sm:text-lg font-bold text-white tracking-wide">{contactName}</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/80 flex flex-col items-center justify-center z-10">
                  <img
                    src={contactAvatar}
                    alt={contactName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-500/80 shadow-2xl mb-3 animate-pulse"
                  />
                  <span className="text-base sm:text-lg font-bold text-white tracking-wide">{contactName}</span>
                </div>
              )
            ) : null}

            {/* TOP-RIGHT Local Camera Preview PIP ("Mi cámara") */}
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
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
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

      {/* Controls Bar */}
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
