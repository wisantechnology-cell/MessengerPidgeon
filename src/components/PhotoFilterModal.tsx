import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Upload,
  Camera,
  RefreshCw,
  Video as VideoIcon,
  Square,
  Play,
  Film,
  Loader2,
} from 'lucide-react';

interface PhotoFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhoto: (
    mediaUrl: string,
    caption: string,
    filter: string,
    fileName: string,
    mediaType?: 'image' | 'video'
  ) => void;
  contactName?: string;
}

export const PhotoFilterModal: React.FC<PhotoFilterModalProps> = ({
  isOpen,
  onClose,
  onSendPhoto,
  contactName = 'Contacto',
}) => {
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaName, setMediaName] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecordingVideo(false);
    setRecordSeconds(0);
  };

  // Start live camera
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true, // Allow microphone for video recording
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraFacing(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access denied or error, retrying video only:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        setCameraFacing(facing);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Camera failed:', e);
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Capture instant photo from camera
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSelectedMedia(dataUrl);
        setMediaType('image');
        setMediaName(`Foto_${Date.now()}.jpg`);
        stopCamera();
      }
    }
  };

  // Start recording video clip with camera
  const handleStartRecordVideo = async () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];

    // Ensure camera stream has an active audio track for crystal-clear voice and sound in the video
    if (streamRef.current.getAudioTracks().length === 0) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStream.getAudioTracks().forEach((track) => {
          streamRef.current?.addTrack(track);
        });
      } catch (err) {
        console.warn('Could not acquire separate microphone track for video recording:', err);
      }
    }

    // Determine the highest fidelity supported format
    const candidateTypes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = 'video/mp4';
    for (const cand of candidateTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(cand)) {
        selectedMime = cand;
        break;
      }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || selectedMime || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: actualMime });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            let dataUri = reader.result;
            if (!dataUri.startsWith('data:video/')) {
              dataUri = dataUri.replace(/^data:[^;]+;/, `data:${actualMime};`);
            }
            setSelectedMedia(dataUri);
            setMediaType('video');
            setMediaName(`Video_${Date.now()}.${actualMime.includes('webm') ? 'webm' : 'mp4'}`);
            stopCamera();
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
    }
  };

  // Stop recording video clip
  const handleStopRecordVideo = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping video recording:', err);
      }
    }
    setIsRecordingVideo(false);
  };

  // Switch front/back camera
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  // Upload photo or video file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideoFile =
        file.type.startsWith('video') ||
        /\.(mp4|mov|webm|mkv|3gp|m4v)$/i.test(file.name);

      let targetMime = file.type;
      if (!targetMime || targetMime === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'webm') targetMime = 'video/webm';
        else if (ext === 'mov' || ext === 'mp4' || ext === '3gp' || ext === 'm4v' || ext === 'mkv') targetMime = 'video/mp4';
        else if (ext === 'png') targetMime = 'image/png';
        else if (ext === 'webp') targetMime = 'image/webp';
        else targetMime = isVideoFile ? 'video/mp4' : 'image/jpeg';
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          let res = reader.result;
          if (isVideoFile && (!res.startsWith('data:video/') || res.startsWith('data:application/octet-stream'))) {
            res = res.replace(/^data:[^;]+;/, `data:${targetMime};`);
          }
          setSelectedMedia(res);
          setMediaType(isVideoFile ? 'video' : 'image');
          setMediaName(file.name);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Send photo or video
  const handleSend = async () => {
    if (!selectedMedia) return;
    setIsUploading(true);

    let finalMediaUrl = selectedMedia;

    // If media is a data URL, upload to server storage to avoid Firestore 1MB document quota limit
    if (selectedMedia.startsWith('data:')) {
      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: selectedMedia,
            filename: mediaName,
          }),
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.mediaUrl) {
            finalMediaUrl = resData.mediaUrl;
          }
        }
      } catch (err) {
        console.warn('Media upload to server failed, using local payload:', err);
      }
    }

    onSendPhoto(
      finalMediaUrl,
      caption.trim(),
      '',
      mediaName || (mediaType === 'video' ? 'Video.mp4' : 'Foto.jpg'),
      mediaType
    );

    setIsUploading(false);
    stopCamera();
    setSelectedMedia('');
    setMediaName('');
    setCaption('');
    onClose();
  };

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedMedia('');
      setMediaName('');
      setCaption('');
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#181d28] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#141822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 text-[#38bdf8] flex items-center justify-center">
              {mediaType === 'video' ? <Film className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="media-modal-title" className="text-sm font-bold text-[#dfe2ee]">
                Enviar Foto o Video
              </h2>
              <p className="text-[11px] text-[#8d90a0]">Para: {contactName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Main Visual Preview / Live Camera */}
          <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#0c0f17] flex items-center justify-center border border-white/10 shadow-inner">
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Live Recording Badge */}
                {isRecordingVideo && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-lg animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Grabando Video: {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}</span>
                  </div>
                )}

                {/* Camera controls overlay */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-5 z-20 px-3">
                  <button
                    onClick={handleToggleFacing}
                    title="Girar cámara"
                    disabled={isRecordingVideo}
                    className="w-11 h-11 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Take Photo Button */}
                  {!isRecordingVideo ? (
                    <button
                      onClick={handleCapturePhoto}
                      title="Tomar Foto"
                      className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <div className="w-full h-full rounded-full border-2 border-black bg-white flex items-center justify-center">
                        <Camera className="w-6 h-6 text-black" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecordVideo}
                      title="Detener Grabación"
                      className="w-16 h-16 rounded-full bg-red-600 p-1 shadow-2xl active:scale-90 transition-all cursor-pointer flex items-center justify-center animate-pulse"
                    >
                      <Square className="w-7 h-7 text-white fill-white" />
                    </button>
                  )}

                  {/* Record Video Button */}
                  {!isRecordingVideo ? (
                    <button
                      onClick={handleStartRecordVideo}
                      title="Grabar Video con Cámara"
                      className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white border border-red-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg"
                    >
                      <VideoIcon className="w-5 h-5" />
                    </button>
                  ) : null}

                  <button
                    onClick={stopCamera}
                    title="Cancelar"
                    className="w-11 h-11 rounded-full bg-black/60 text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : selectedMedia ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {mediaType === 'video' ? (
                  <video
                    src={selectedMedia}
                    controls
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={selectedMedia}
                    alt={mediaName || 'Foto seleccionada'}
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedMedia('');
                    setMediaName('');
                  }}
                  title="Cambiar archivo"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors flex items-center justify-center cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Blank state */
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#38bdf8]">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ningún archivo seleccionado</h3>
                  <p className="text-xs text-[#8d90a0] mt-1 max-w-xs">
                    Toma una foto, graba un video con tu cámara o sube fotos y videos directamente desde tu galería.
                  </p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Mode Switchers: Camera / Upload from device */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera('user');
                }
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-[#2563eb] text-white border-blue-400 shadow-md'
                  : 'bg-[#212634] text-[#dfe2ee] border-white/10 hover:bg-[#2a3042]'
              }`}
            >
              <Camera className="w-4 h-4 text-[#38bdf8]" />
              <span>{isCameraActive ? 'Cámara Activa' : 'Abrir Cámara'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#212634] hover:bg-[#2a3042] border border-white/10 text-[#dfe2ee] text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              <Upload className="w-4 h-4 text-[#7bd0ff]" />
              <span>Subir Foto o Video</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Caption Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#dfe2ee]">
              Pie de {mediaType === 'video' ? 'video' : 'foto'} o mensaje (opcional):
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={mediaType === 'video' ? 'Escribe algo sobre este video...' : 'Escribe algo sobre esta foto...'}
              className="w-full bg-[#0f131c] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-white/5 bg-[#141822] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8d90a0] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={handleSend}
            disabled={!selectedMedia || isCameraActive || isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando multimedia...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar {mediaType === 'video' ? 'Video' : 'Foto'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
