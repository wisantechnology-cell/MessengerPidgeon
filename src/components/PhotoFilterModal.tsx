import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Send,
  Upload,
  Camera,
  RefreshCw,
  Video as VideoIcon,
  Square,
  Film,
  Loader2,
  Mic,
  MicOff,
  AlertCircle,
  Crown,
  Sparkles,
  Glasses,
  Heart,
  Sliders,
  Type,
  Pencil,
  RotateCcw,
  Undo2,
  Smile,
  Palette,
  Sun,
  Feather,
  Eye,
  ScanFace,
  Ban,
} from 'lucide-react';
import {
  CAMERA_FILTERS,
  FILTER_CATEGORIES,
  getFilterById,
  type CameraFilterDef,
  type FilterCategory,
} from '../filters/filterCatalog';
import { FaceTracker } from '../filters/faceTracker';
import { ThreeFaceFilterEngine } from '../filters/threeFaceScene';
import { CanvasFilterRenderer } from '../filters/canvasFilterRenderer';

interface PhotoFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhoto: (
    mediaUrl: string,
    caption: string,
    filter: string,
    fileName: string,
    mediaType?: 'image' | 'video',
    thumbnailUrl?: string,
    mediaSize?: string
  ) => void;
  contactName?: string;
  initialFilterMode?: 'with_filter' | 'no_filter';
}

interface DrawStroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '1.0 MB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function captureCanvasThumbnail(canvas: HTMLCanvasElement): string | undefined {
  try {
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return undefined;
    const maxW = 480;
    const scale = Math.min(1, maxW / w);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = Math.round(w * scale);
    thumbCanvas.height = Math.round(h * scale);
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return thumbCanvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return undefined;
  }
}

function captureVideoElementThumbnail(videoEl: HTMLVideoElement): string | undefined {
  try {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return undefined;
    const maxW = 480;
    const scale = Math.min(1, maxW / vw);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } catch {
    return undefined;
  }
}

function generateFileVideoThumbnail(objectUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const tempVideo = document.createElement('video');
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.preload = 'auto';
    let settled = false;

    const finish = (thumb?: string) => {
      if (settled) return;
      settled = true;
      tempVideo.removeAttribute('src');
      tempVideo.load();
      resolve(thumb);
    };

    const timeout = setTimeout(() => finish(undefined), 2500);

    tempVideo.onloadeddata = () => {
      try {
        if (tempVideo.duration && tempVideo.duration > 0.2) {
          tempVideo.currentTime = Math.min(0.25, tempVideo.duration / 3);
        } else {
          clearTimeout(timeout);
          finish(captureVideoElementThumbnail(tempVideo));
        }
      } catch {
        clearTimeout(timeout);
        finish(captureVideoElementThumbnail(tempVideo));
      }
    };

    tempVideo.onseeked = () => {
      clearTimeout(timeout);
      finish(captureVideoElementThumbnail(tempVideo));
    };

    tempVideo.onerror = () => {
      clearTimeout(timeout);
      finish(undefined);
    };

    tempVideo.src = objectUrl;
  });
}

function renderFilterThumbIcon(iconKey: CameraFilterDef['iconKey']) {
  const cls = 'w-5 h-5 text-white drop-shadow-sm';
  switch (iconKey) {
    case 'none':
      return <Ban className="w-4 h-4 text-slate-300" />;
    case 'crown':
      return <Crown className={cls} />;
    case 'wings':
      return <Feather className={cls} />;
    case 'visor':
      return <Eye className={cls} />;
    case 'mask':
      return <Sparkles className={cls} />;
    case 'glasses':
      return <Glasses className={cls} />;
    case 'hearts':
      return <Heart className={cls} />;
    case 'dog':
      return (
        <span className="text-lg leading-none select-none" aria-hidden="true">
          🐶
        </span>
      );
    case 'cat':
      return (
        <span className="text-lg leading-none select-none" aria-hidden="true">
          🐱
        </span>
      );
    case 'butterfly':
      return (
        <span className="text-lg leading-none select-none" aria-hidden="true">
          🦋
        </span>
      );
    case 'makeup':
      return <Smile className={cls} />;
    case 'beauty':
    case 'porcelain':
      return <Sparkles className={cls} />;
    case 'golden':
      return <Sun className={cls} />;
    case 'vintage':
    case 'noir':
    case 'neon':
    default:
      return <Palette className={cls} />;
  }
}

const DOODLE_COLORS = ['#ffffff', '#38bdf8', '#fbbf24', '#fb7185', '#34d399'];

export const PhotoFilterModal: React.FC<PhotoFilterModalProps> = ({
  isOpen,
  onClose,
  onSendPhoto,
  contactName = 'Contacto',
  initialFilterMode = 'with_filter',
}) => {
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaName, setMediaName] = useState<string>('');
  const [mediaSizeLabel, setMediaSizeLabel] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [caption, setCaption] = useState<string>('');

  // Camera & AR State
  const [filterMode, setFilterMode] = useState<'with_filter' | 'no_filter'>(initialFilterMode);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [hasMicAudio, setHasMicAudio] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter Lens State
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeFilterId, setActiveFilterId] = useState<string>('none');
  const [beautyIntensity, setBeautyIntensity] = useState<number>(0.6);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [trackerStatus, setTrackerStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [lensToast, setLensToast] = useState<{ name: string; badge?: string } | null>(null);

  // Post-capture quick photo edit state
  const [editTool, setEditTool] = useState<'none' | 'draw' | 'text'>('none');
  const [drawColor, setDrawColor] = useState<string>('#38bdf8');
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlayTextY, setOverlayTextY] = useState<number>(0.5);
  const [isEditingOverlayText, setIsEditingOverlayText] = useState<boolean>(false);

  // Refs for stable real-time loop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const extraMicStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedBlobRef = useRef<Blob | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const liveThumbRef = useRef<string | undefined>(undefined);
  const isCancellingRef = useRef<boolean>(false);

  const faceTrackerRef = useRef<FaceTracker | null>(null);
  const threeEngineRef = useRef<ThreeFaceFilterEngine | null>(null);
  const canvasRendererRef = useRef<CanvasFilterRenderer | null>(null);
  const rafIdRef = useRef<number>(0);

  const activeFilterRef = useRef<CameraFilterDef>(CAMERA_FILTERS[0]);
  const filterModeRef = useRef<'with_filter' | 'no_filter'>(initialFilterMode);
  const beautyRef = useRef<number>(0.6);
  const facingRef = useRef<'user' | 'environment'>('user');
  const lensToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDrawingStrokeRef = useRef<boolean>(false);
  const activeLensBtnRef = useRef<HTMLButtonElement | null>(null);

  const activeFilter = useMemo(() => getFilterById(activeFilterId), [activeFilterId]);
  const visibleFilters = useMemo(() => {
    if (activeCategory === 'all') return CAMERA_FILTERS;
    return CAMERA_FILTERS.filter((f) => {
      if (f.id === 'none') return true;
      if (activeCategory === '3d') return Boolean(f.is3D);
      if (activeCategory === 'exclusive') return Boolean(f.isExclusive);
      if (activeCategory === 'animated') return Boolean(f.isAnimated);
      return f.category === activeCategory;
    });
  }, [activeCategory]);

  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
    if (activeFilter.supportsBeautySlider && typeof activeFilter.beautyStrength === 'number') {
      setBeautyIntensity(activeFilter.beautyStrength);
    }
  }, [activeFilter]);

  useEffect(() => {
    beautyRef.current = beautyIntensity;
  }, [beautyIntensity]);

  useEffect(() => {
    facingRef.current = cameraFacing;
  }, [cameraFacing]);

  const selectFilterWithToast = useCallback((filterId: string) => {
    const f = getFilterById(filterId);
    setActiveFilterId(f.id);
    setLensToast({ name: f.name, badge: f.badge });
    if (lensToastTimerRef.current) clearTimeout(lensToastTimerRef.current);
    lensToastTimerRef.current = setTimeout(() => {
      setLensToast(null);
    }, 1500);
  }, []);

  useEffect(() => {
    if (activeLensBtnRef.current) {
      activeLensBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeFilterId, activeCategory]);

  const clearPreviewEdits = () => {
    setEditTool('none');
    setStrokes([]);
    setOverlayText('');
    setOverlayTextY(0.5);
    setIsEditingOverlayText(false);
  };

  const clearPreviewMedia = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    selectedBlobRef.current = null;
    liveThumbRef.current = undefined;
    setSelectedMedia('');
    setMediaName('');
    setMediaSizeLabel('');
    setThumbnailUrl(undefined);
    clearPreviewEdits();
  };

  const stopRenderLoop = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  };

  const stopCamera = (discardRecording = true) => {
    stopRenderLoop();
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (discardRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      isCancellingRef.current = true;
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (extraMicStreamRef.current) {
      extraMicStreamRef.current.getTracks().forEach((track) => track.stop());
      extraMicStreamRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setIsRecordingVideo(false);
    setRecordSeconds(0);
    setFaceDetected(false);
  };

  const ensureFaceEnginesInitialized = useCallback(async (withArEngines = true) => {
    if (!canvasRendererRef.current) {
      canvasRendererRef.current = new CanvasFilterRenderer();
    }
    if (!withArEngines) return;
    if (!threeEngineRef.current) {
      threeEngineRef.current = new ThreeFaceFilterEngine(720, 960);
    }
    if (!faceTrackerRef.current) {
      faceTrackerRef.current = new FaceTracker();
    }
    if (trackerStatus === 'idle') {
      setTrackerStatus('loading');
      const ok = await faceTrackerRef.current.init();
      setTrackerStatus(ok ? 'ready' : 'error');
    }
  }, [trackerStatus]);

  const startCamera = useCallback(
    async (
      facing: 'user' | 'environment' = cameraFacing,
      modeOverride?: 'with_filter' | 'no_filter'
    ) => {
      stopCamera(true);
      clearPreviewMedia();
      setErrorMsg(null);
      setIsStartingCamera(true);

      const useFilters = (modeOverride ?? filterModeRef.current) === 'with_filter';
      // Kick off MediaPipe FaceLandmarker + Three.js engine initialization only when filters are enabled
      ensureFaceEnginesInitialized(useFilters);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;
        setHasMicAudio(stream.getAudioTracks().some((t) => t.readyState === 'live'));
        setCameraFacing(facing);
        setIsCameraActive(true);
        setIsStartingCamera(false);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
          streamRef.current = stream;
          setHasMicAudio(false);
          setCameraFacing(facing);
          setIsCameraActive(true);
          setIsStartingCamera(false);
        } catch (err) {
          console.warn('Camera failed:', err);
          setErrorMsg('No se pudo abrir la cámara. Revisa los permisos o sube desde tu galería.');
          setIsCameraActive(false);
          setIsStartingCamera(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cameraFacing]
  );

  // Real-time face tracking + Three.js + 2D AR render loop
  useEffect(() => {
    if (!isOpen || !isCameraActive || !streamRef.current || !videoRef.current) {
      stopRenderLoop();
      return;
    }

    const videoEl = videoRef.current;
    videoEl.srcObject = streamRef.current;
    videoEl.play().catch(() => {});

    if (!canvasRendererRef.current) {
      canvasRendererRef.current = new CanvasFilterRenderer();
    }
    if (!threeEngineRef.current) {
      threeEngineRef.current = new ThreeFaceFilterEngine(720, 960);
    }

    let lastTs = performance.now();
    const startTs = lastTs;
    let lastUiDetectSync = 0;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      const elapsedSec = (now - startTs) / 1000;
      lastTs = now;

      const outCanvas = outputCanvasRef.current;
      if (outCanvas && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        const mirrored = facingRef.current === 'user';
        const isFilteredMode = filterModeRef.current === 'with_filter';
        const defaultEmptyFace = {
          detected: false,
          landmarks: [],
          noseTip: { x: 0.5, y: 0.5, z: 0 },
          noseBridge: { x: 0.5, y: 0.45, z: 0 },
          foreheadTop: { x: 0.5, y: 0.28, z: 0 },
          chinBottom: { x: 0.5, y: 0.72, z: 0 },
          leftEye: { x: 0.42, y: 0.43, z: 0 },
          rightEye: { x: 0.58, y: 0.43, z: 0 },
          leftCheek: { x: 0.36, y: 0.55, z: 0 },
          rightCheek: { x: 0.64, y: 0.55, z: 0 },
          mouthCenter: { x: 0.5, y: 0.62, z: 0 },
          upperLip: { x: 0.5, y: 0.61, z: 0 },
          lowerLip: { x: 0.5, y: 0.63, z: 0 },
          faceCenter: { x: 0.5, y: 0.5, z: 0 },
          interOcularDist: 0.14,
          faceWidth: 0.34,
          faceHeight: 0.45,
          roll: 0,
          yaw: 0,
          pitch: 0,
          jawOpen: 0,
          smile: 0,
          leftBlink: 0,
          rightBlink: 0,
        };
        const face =
          isFilteredMode && faceTrackerRef.current
            ? faceTrackerRef.current.detect(videoEl, mirrored)
            : defaultEmptyFace;

        if (now - lastUiDetectSync > 180) {
          lastUiDetectSync = now;
          setFaceDetected(isFilteredMode ? face.detected : false);
        }

        canvasRendererRef.current?.renderFrame({
          outputCanvas: outCanvas,
          video: videoEl,
          mirrored,
          filter: isFilteredMode ? activeFilterRef.current : CAMERA_FILTERS[0],
          beautyIntensity: isFilteredMode ? beautyRef.current : 0,
          face,
          threeEngine: isFilteredMode ? threeEngineRef.current : null,
          dt,
          elapsedSec,
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      stopRenderLoop();
    };
  }, [isOpen, isCameraActive]);

  // Auto-open front camera when modal opens, and clean up thoroughly on close/unmount
  useEffect(() => {
    if (isOpen) {
      setFilterMode(initialFilterMode);
      filterModeRef.current = initialFilterMode;
      setActiveCategory('all');
      setCaptureMode('photo');
      if (initialFilterMode === 'no_filter') {
        setActiveFilterId('none');
        setBeautyIntensity(0);
        setLensToast(null);
      } else {
        setActiveFilterId('crown_3d_royal');
      }
      startCamera('user', initialFilterMode);
    } else {
      stopCamera(true);
      clearPreviewMedia();
      setCaption('');
      setErrorMsg(null);
      setIsUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFilterMode]);

  useEffect(() => {
    return () => {
      stopCamera(true);
      if (lensToastTimerRef.current) clearTimeout(lensToastTimerRef.current);
      faceTrackerRef.current?.dispose();
      faceTrackerRef.current = null;
      threeEngineRef.current?.dispose();
      threeEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture filtered photo straight from the live composited outputCanvas
  const handleCapturePhoto = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        clearPreviewMedia();
        if (blob) {
          selectedBlobRef.current = blob;
          const objUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objUrl;
          setSelectedMedia(objUrl);
          setMediaSizeLabel(formatBytes(blob.size));
        } else {
          setSelectedMedia(canvas.toDataURL('image/jpeg', 0.92));
        }
        setMediaType('image');
        const filterTag = activeFilter.id !== 'none' ? `_${activeFilter.shortName.replace(/\s+/g, '')}` : '';
        setMediaName(`PidgeX${filterTag}_${Date.now()}.jpg`);
        stopCamera(true);
      },
      'image/jpeg',
      0.92
    );
  };

  // Record video clip from filtered outputCanvas + real mic audio
  const handleStartRecordVideo = async () => {
    const outCanvas = outputCanvasRef.current;
    if (!outCanvas || !streamRef.current) return;
    setErrorMsg(null);
    recordedChunksRef.current = [];
    isCancellingRef.current = false;

    const canvasStream = outCanvas.captureStream(30);
    const canvasVideoTracks = canvasStream.getVideoTracks().filter((t) => t.readyState === 'live');
    if (canvasVideoTracks.length === 0) {
      setErrorMsg('No hay señal activa para grabar.');
      return;
    }

    let audioTracks = streamRef.current.getAudioTracks().filter((t) => t.readyState === 'live');
    if (audioTracks.length === 0) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        extraMicStreamRef.current = micStream;
        audioTracks = micStream.getAudioTracks().filter((t) => t.readyState === 'live');
        setHasMicAudio(audioTracks.length > 0);
      } catch {
        setHasMicAudio(false);
      }
    }

    audioTracks.forEach((t) => {
      t.enabled = true;
    });

    liveThumbRef.current = captureCanvasThumbnail(outCanvas);
    const combinedStream = new MediaStream([...canvasVideoTracks, ...audioTracks]);

    const candidateTypes =
      audioTracks.length > 0
        ? [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4',
          ]
        : ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4'];

    let selectedMime = '';
    for (const cand of candidateTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(cand)) {
        selectedMime = cand;
        break;
      }
    }

    try {
      let recorder: MediaRecorder;
      try {
        recorder = selectedMime
          ? new MediaRecorder(combinedStream, {
              mimeType: selectedMime,
              videoBitsPerSecond: 2400000,
              audioBitsPerSecond: 128000,
            })
          : new MediaRecorder(combinedStream);
      } catch {
        recorder = selectedMime
          ? new MediaRecorder(combinedStream, { mimeType: selectedMime })
          : new MediaRecorder(combinedStream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (isCancellingRef.current) {
          recordedChunksRef.current = [];
          return;
        }

        if (outputCanvasRef.current) {
          const endThumb = captureCanvasThumbnail(outputCanvasRef.current);
          if (endThumb) liveThumbRef.current = endThumb;
        }

        const rawMime = recorder.mimeType || selectedMime || 'video/webm';
        const baseMime = rawMime.split(';')[0].trim() || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: baseMime });

        if (!blob || blob.size === 0) {
          setErrorMsg('El video grabado quedó vacío. Graba al menos 1 segundo.');
          stopCamera(false);
          return;
        }

        clearPreviewMedia();
        selectedBlobRef.current = blob;
        const objUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objUrl;

        const thumb = liveThumbRef.current || (await generateFileVideoThumbnail(objUrl));
        setSelectedMedia(objUrl);
        setMediaType('video');
        setMediaName(`Video_${Date.now()}.${baseMime.includes('mp4') ? 'mp4' : 'webm'}`);
        setMediaSizeLabel(formatBytes(blob.size));
        setThumbnailUrl(thumb);

        stopCamera(false);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start filtered MediaRecorder:', err);
      setErrorMsg('Tu navegador no pudo iniciar la grabación de video.');
    }
  };

  const handleStopRecordVideo = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecordingVideo(false);
  };

  const handleShutterAction = () => {
    if (captureMode === 'photo') {
      handleCapturePhoto();
    } else if (isRecordingVideo) {
      handleStopRecordVideo();
    } else {
      handleStartRecordVideo();
    }
  };

  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  // Swipe left/right across viewfinder to cycle filters smoothly
  const handleViewfinderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRecordingVideo || filterMode !== 'with_filter') return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  const handleViewfinderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current || isRecordingVideo || filterMode !== 'with_filter') return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    const dt = performance.now() - swipeStartRef.current.time;
    swipeStartRef.current = null;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 700) {
      const list = visibleFilters.length > 1 ? visibleFilters : CAMERA_FILTERS;
      const idx = Math.max(
        0,
        list.findIndex((f) => f.id === activeFilterId)
      );
      const nextIdx = dx < 0 ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length;
      selectFilterWithToast(list[nextIdx].id);
    }
  };

  // Upload photo or video file from device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const isVideoFile =
      file.type.startsWith('video') || /\.(mp4|mov|webm|mkv|3gp|m4v)$/i.test(file.name);

    stopCamera(true);
    clearPreviewMedia();

    selectedBlobRef.current = file;
    const objUrl = URL.createObjectURL(file);
    objectUrlRef.current = objUrl;

    setSelectedMedia(objUrl);
    setMediaType(isVideoFile ? 'video' : 'image');
    setMediaName(file.name);
    setMediaSizeLabel(formatBytes(file.size));

    if (isVideoFile) {
      const thumb = await generateFileVideoThumbnail(objUrl);
      setThumbnailUrl(thumb);
    }
  };

  // Redraw freehand doodle strokes onto edit overlay canvas
  useEffect(() => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes, selectedMedia, mediaType]);

  const handleEditCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editTool !== 'draw' || !editCanvasRef.current) return;
    const rect = editCanvasRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    isDrawingStrokeRef.current = true;
    setStrokes((prev) => [...prev, { color: drawColor, width: 6, points: [{ x: nx, y: ny }] }]);
  };

  const handleEditCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingStrokeRef.current || editTool !== 'draw' || !editCanvasRef.current) return;
    const rect = editCanvasRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...last,
        points: [...last.points, { x: nx, y: ny }],
      };
      return copy;
    });
  };

  const handleEditCanvasPointerUp = () => {
    isDrawingStrokeRef.current = false;
  };

  // Bake photo edits (doodles & text bar) into a fresh JPEG Blob before uploading
  const bakeEditedPhotoBlobIfNeeded = async (): Promise<Blob | null> => {
    const hasEdits = strokes.length > 0 || overlayText.trim().length > 0;
    if (!hasEdits || mediaType !== 'image' || !selectedMedia) {
      return selectedBlobRef.current;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = img.naturalWidth || 720;
        const h = img.naturalHeight || 960;
        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = w;
        mergeCanvas.height = h;
        const ctx = mergeCanvas.getContext('2d');
        if (!ctx) {
          resolve(selectedBlobRef.current);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        // Bake strokes
        strokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          ctx.save();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = Math.max(4, (stroke.width / 720) * w);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
          }
          ctx.stroke();
          ctx.restore();
        });

        // Bake Snapchat-style text ribbon
        const text = overlayText.trim();
        if (text) {
          const barY = h * overlayTextY;
          const barH = Math.max(48, Math.round(h * 0.082));
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
          ctx.fillRect(0, barY - barH * 0.5, w, barH);
          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${Math.max(20, Math.round(h * 0.036))}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, w * 0.5, barY, w * 0.9);
          ctx.restore();
        }

        mergeCanvas.toBlob(
          (blob) => resolve(blob || selectedBlobRef.current),
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => resolve(selectedBlobRef.current);
      img.src = selectedMedia;
    });
  };

  // Upload media to server and dispatch into chat
  const handleSend = async () => {
    if (!selectedMedia) return;
    setIsUploading(true);
    setErrorMsg(null);

    const finalFileName = mediaName || (mediaType === 'video' ? 'Video.webm' : 'Foto.jpg');
    let finalMediaUrl = selectedMedia;

    try {
      const uploadBlob = await bakeEditedPhotoBlobIfNeeded();
      if (uploadBlob) {
        const response = await fetch(
          `/api/media/upload-raw?filename=${encodeURIComponent(finalFileName)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                uploadBlob.type || (mediaType === 'video' ? 'video/webm' : 'image/jpeg'),
            },
            body: uploadBlob,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
        const resData = await response.json();
        if (!resData.mediaUrl) {
          throw new Error('Missing mediaUrl in server response');
        }
        finalMediaUrl = resData.mediaUrl;
      } else if (selectedMedia.startsWith('data:')) {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: selectedMedia,
            filename: finalFileName,
          }),
        });
        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
        const resData = await response.json();
        if (!resData.mediaUrl) {
          throw new Error('Missing mediaUrl in server response');
        }
        finalMediaUrl = resData.mediaUrl;
      }

      onSendPhoto(
        finalMediaUrl,
        caption.trim(),
        activeFilter.id !== 'none' ? activeFilter.name : '',
        finalFileName,
        mediaType,
        thumbnailUrl,
        mediaSizeLabel || undefined
      );

      stopCamera(true);
      clearPreviewMedia();
      setCaption('');
      onClose();
    } catch (err) {
      console.error('Error uploading filtered media:', err);
      setErrorMsg('No se pudo subir el archivo al servidor. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/88 animate-in fade-in duration-150"
    >
      <div className="relative w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-[440px] bg-[#0b0f17] sm:border sm:border-white/10 sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Floating Header HUD */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111622] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0284c7]/20 text-[#38bdf8] flex items-center justify-center shrink-0">
              {mediaType === 'video' && selectedMedia ? (
                <Film className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="media-modal-title" className="text-xs font-semibold text-white truncate">
                Cámara PidgeX
              </h2>
              <p className="text-[11px] text-[#94a3b8] truncate">
                {selectedMedia
                  ? `Para ${contactName}`
                  : filterMode === 'with_filter'
                  ? `Con filtro · Para ${contactName}`
                  : `Sin filtro · Para ${contactName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isCameraActive && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = filterMode === 'with_filter' ? 'no_filter' : 'with_filter';
                    setFilterMode(nextMode);
                    filterModeRef.current = nextMode;
                    if (nextMode === 'no_filter') {
                      setActiveFilterId('none');
                      setBeautyIntensity(0);
                      setLensToast(null);
                    } else {
                      ensureFaceEnginesInitialized(true);
                      if (activeFilterId === 'none') {
                        selectFilterWithToast('crown_3d_royal');
                      }
                    }
                  }}
                  disabled={isRecordingVideo}
                  title={filterMode === 'with_filter' ? 'Cambiar a cámara sin filtro' : 'Activar filtros 3D'}
                  className={`px-2.5 h-9 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                    filterMode === 'with_filter'
                      ? 'bg-sky-500/20 text-[#38bdf8] border border-sky-400/35'
                      : 'bg-white/8 text-[#cbd5e1] border border-white/10 hover:bg-white/15'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{filterMode === 'with_filter' ? 'Con filtro' : 'Sin filtro'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleFacing}
                  disabled={isRecordingVideo}
                  aria-label="Cambiar cámara frontal o trasera"
                  title="Girar cámara"
                  className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecordingVideo}
                  aria-label="Subir foto o video de galería"
                  title="Galería"
                  className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 text-[#38bdf8] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                stopCamera(true);
                onClose();
              }}
              aria-label="Cerrar cámara"
              className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Main Viewport: Live AR Camera OR Captured Media Preview */}
        {!selectedMedia ? (
          <div className="flex-1 flex flex-col min-h-0 bg-black">
            {/* Live Composited AR Viewfinder */}
            <div
              onPointerDown={handleViewfinderPointerDown}
              onPointerUp={handleViewfinderPointerUp}
              className="relative flex-1 min-h-[300px] w-full overflow-hidden bg-black flex items-center justify-center touch-pan-y select-none"
            >
              {/* Hidden raw video stream feeding the compositing pipeline */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="sr-only"
              />

              {/* Composited AR + 3D + Beauty + Color Canvas */}
              <canvas
                ref={outputCanvasRef}
                width={720}
                height={960}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Camera loading or permission error state */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-[#0d121c]">
                  {isStartingCamera ? (
                    <>
                      <Loader2 className="w-9 h-9 text-[#38bdf8] animate-spin" />
                      <p className="text-xs text-[#cbd5e1]">Iniciando cámara y lentes 3D...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-[#0284c7]/15 text-[#38bdf8] flex items-center justify-center">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Cámara no disponible</h3>
                        <p className="text-xs text-[#94a3b8] mt-1 max-w-xs">
                          {errorMsg || 'Activa los permisos de cámara o elige un archivo de tu galería.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                        <button
                          type="button"
                          onClick={() => startCamera('user')}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Reintentar cámara</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1e2534] hover:bg-[#273044] border border-white/10 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#38bdf8]" />
                          <span>Subir de galería</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Top Viewfinder Status Row (Solid rgba surfaces, zero backdrop-blur, zero pulsing dots) */}
              {isCameraActive && (
                <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
                  {isRecordingVideo ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold tabular-nums shadow">
                      <span className="w-2 h-2 rounded-xs bg-white" />
                      <span>
                        {Math.floor(recordSeconds / 60)}:
                        {String(recordSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                  ) : filterMode === 'with_filter' ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[11px] font-medium">
                      <ScanFace
                        className={`w-3.5 h-3.5 ${
                          faceDetected
                            ? 'text-emerald-400'
                            : trackerStatus === 'loading'
                            ? 'text-[#38bdf8]'
                            : 'text-amber-300'
                        }`}
                      />
                      <span>
                        {trackerStatus === 'loading'
                          ? 'Cargando IA facial...'
                          : faceDetected
                          ? 'Rostro rastreado'
                          : 'Centra tu rostro'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[11px] font-medium">
                      <Camera className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Modo natural sin filtro</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[11px]">
                    {hasMicAudio ? (
                      <>
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Audio listo</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sin micro</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Filter Hint (e.g. "Abre la boca para sacar la lengua") */}
              {isCameraActive &&
                filterMode === 'with_filter' &&
                !lensToast &&
                faceDetected &&
                activeFilter.interactiveHint && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-lg bg-black/70 text-[#fde68a] text-[11px] font-medium pointer-events-none whitespace-nowrap">
                    {activeFilter.interactiveHint}
                  </div>
                )}

              {/* Smooth Filter Change Toast */}
              {isCameraActive && filterMode === 'with_filter' && lensToast && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-1.5 rounded-xl bg-black/72 border border-white/15 text-center shadow-lg">
                    {lensToast.badge && (
                      <span className="block text-[10px] font-bold tracking-wider text-[#38bdf8] uppercase">
                        {lensToast.badge}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-white">{lensToast.name}</span>
                  </div>
                </div>
              )}

              {/* Swipe Hint */}
              {isCameraActive && filterMode === 'with_filter' && activeFilterId === 'none' && !lensToast && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-lg bg-black/55 text-[#cbd5e1] text-[11px] pointer-events-none whitespace-nowrap">
                  Desliza a los lados para cambiar filtro
                </div>
              )}
            </div>

            {/* Snapchat-Inspired Unified Bottom Dock */}
            <div className="bg-[#111622] border-t border-white/10 px-3 pt-2.5 pb-3.5 flex flex-col gap-2.5 shrink-0">
              {/* Beauty Smoothing Slider (only when filter mode is active and filter supports beauty control) */}
              {filterMode === 'with_filter' && activeFilter.supportsBeautySlider && (
                <div className="flex items-center gap-2.5 px-2 py-1 bg-[#171e2e] rounded-xl border border-white/5">
                  <Sliders className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span className="text-[11px] text-[#cbd5e1] font-medium shrink-0">
                    Belleza
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(beautyIntensity * 100)}
                    onChange={(e) => setBeautyIntensity(Number(e.target.value) / 100)}
                    aria-label="Intensidad de filtro de belleza"
                    className="flex-1 accent-[#38bdf8] h-1.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-white tabular-nums w-8 text-right">
                    {Math.round(beautyIntensity * 100)}%
                  </span>
                </div>
              )}

              {filterMode === 'with_filter' && (
                <>
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {FILTER_CATEGORIES.map((cat) => {
                      const selected = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#0284c7] text-white'
                              : 'bg-[#1a2233] text-[#94a3b8] hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Horizontal Lens Gallery Carousel */}
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-1">
                    {visibleFilters.map((f) => {
                      const isSelected = f.id === activeFilterId;
                      return (
                        <button
                          key={f.id}
                          ref={isSelected ? activeLensBtnRef : null}
                          type="button"
                          onClick={() => selectFilterWithToast(f.id)}
                          disabled={isRecordingVideo}
                          aria-label={`Filtro ${f.name}`}
                          className="flex flex-col items-center gap-1 shrink-0 min-w-[58px] cursor-pointer disabled:opacity-50 group"
                        >
                          <div
                            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 ${
                              isSelected
                                ? 'ring-2 ring-[#38bdf8] ring-offset-2 ring-offset-[#111622] scale-105'
                                : 'ring-1 ring-white/20 opacity-85 group-hover:opacity-100'
                            }`}
                            style={{ background: f.swatchGradient }}
                          >
                            {renderFilterThumbIcon(f.iconKey)}
                            {f.badge && (
                              <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-[#0f172a] border border-white/25 text-[9px] font-bold text-[#38bdf8] leading-tight">
                                {f.badge}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium max-w-[60px] truncate ${
                              isSelected ? 'text-[#38bdf8]' : 'text-[#94a3b8]'
                            }`}
                          >
                            {f.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Capture Mode Selector + Main Shutter */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                {/* Photo / Video Switcher */}
                <div className="flex items-center bg-[#182030] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    disabled={isRecordingVideo}
                    onClick={() => setCaptureMode('photo')}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      captureMode === 'photo'
                        ? 'bg-[#0284c7] text-white'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Foto</span>
                  </button>
                  <button
                    type="button"
                    disabled={isRecordingVideo}
                    onClick={() => setCaptureMode('video')}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      captureMode === 'video'
                        ? 'bg-red-600 text-white'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>

                {/* Big Center Shutter Button */}
                <button
                  type="button"
                  onClick={handleShutterAction}
                  disabled={!isCameraActive}
                  aria-label={
                    captureMode === 'photo'
                      ? 'Tomar foto con filtro'
                      : isRecordingVideo
                      ? 'Detener grabación'
                      : 'Grabar video con filtro'
                  }
                  className={`w-15 h-15 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer disabled:opacity-40 ${
                    captureMode === 'video'
                      ? isRecordingVideo
                        ? 'bg-red-600 border-4 border-white'
                        : 'bg-red-600 border-4 border-white/90 hover:bg-red-500'
                      : 'bg-white border-4 border-[#38bdf8] hover:bg-slate-100'
                  }`}
                >
                  {captureMode === 'video' ? (
                    isRecordingVideo ? (
                      <Square className="w-5 h-5 text-white fill-white" />
                    ) : (
                      <VideoIcon className="w-6 h-6 text-white" />
                    )
                  ) : (
                    <Camera className="w-6 h-6 text-[#0f172a]" />
                  )}
                </button>

                {/* Quick Gallery Shortcut */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecordingVideo}
                  className="min-h-[44px] px-3 rounded-xl bg-[#182030] hover:bg-[#222d42] border border-white/10 text-xs font-semibold text-[#cbd5e1] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Upload className="w-4 h-4 text-[#38bdf8]" />
                  <span>Galería</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Post-Capture Preview & Quick Edit Screen (Photos & Videos) */
          <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f17]">
            <div className="relative flex-1 min-h-[260px] bg-black flex items-center justify-center overflow-hidden">
              {mediaType === 'video' ? (
                <video
                  key={selectedMedia}
                  src={selectedMedia}
                  poster={thumbnailUrl}
                  controls
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={selectedMedia}
                    alt={mediaName || 'Foto capturada'}
                    className="w-full h-full object-contain select-none"
                  />
                  {/* Interactive Doodle Canvas overlay on captured photo */}
                  <canvas
                    ref={editCanvasRef}
                    width={720}
                    height={960}
                    onPointerDown={handleEditCanvasPointerDown}
                    onPointerMove={handleEditCanvasPointerMove}
                    onPointerUp={handleEditCanvasPointerUp}
                    onPointerLeave={handleEditCanvasPointerUp}
                    className={`absolute inset-0 w-full h-full object-contain ${
                      editTool === 'draw' ? 'cursor-crosshair touch-none' : 'pointer-events-none'
                    }`}
                  />
                  {/* Snapchat-style Ribbon Text Overlay */}
                  {overlayText.trim() && (
                    <div
                      style={{ top: `${overlayTextY * 100}%` }}
                      onClick={() => {
                        setEditTool('text');
                        setIsEditingOverlayText(true);
                      }}
                      className="absolute inset-x-0 -translate-y-1/2 bg-black/60 py-2 px-4 text-center cursor-pointer"
                    >
                      <span className="text-white text-base font-semibold tracking-tight">
                        {overlayText}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Retake button floating top-left */}
              <button
                type="button"
                onClick={() => startCamera(cameraFacing)}
                className="absolute top-3 left-3 z-20 min-h-[40px] px-3 py-1.5 rounded-xl bg-black/72 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repetir</span>
              </button>

              {/* Quick Photo Edit Tools top-right (Text & Draw) */}
              {mediaType === 'image' && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  {strokes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                      title="Deshacer trazo"
                      className="w-10 h-10 rounded-full bg-black/72 hover:bg-black text-white border border-white/15 flex items-center justify-center cursor-pointer"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const next = editTool === 'text' ? 'none' : 'text';
                      setEditTool(next);
                      setIsEditingOverlayText(next === 'text');
                    }}
                    title="Añadir texto en foto"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                      editTool === 'text'
                        ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                        : 'bg-black/72 hover:bg-black text-white border-white/15'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingOverlayText(false);
                      setEditTool((prev) => (prev === 'draw' ? 'none' : 'draw'));
                    }}
                    title="Dibujar sobre la foto"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                      editTool === 'draw'
                        ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                        : 'bg-black/72 hover:bg-black text-white border-white/15'
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Active Photo Tool Bar (Draw Colors OR Text Sticker Input) */}
            {mediaType === 'image' && editTool === 'draw' && (
              <div className="px-4 py-2 bg-[#131926] border-t border-white/10 flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#cbd5e1] font-medium">Dibuja en la foto:</span>
                <div className="flex items-center gap-2">
                  {DOODLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDrawColor(c)}
                      aria-label={`Color ${c}`}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        drawColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {mediaType === 'image' && isEditingOverlayText && (
              <div className="px-4 py-2.5 bg-[#131926] border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Texto sobre la foto..."
                    maxLength={60}
                    autoFocus
                    className="flex-1 min-h-[38px] bg-[#0b0f17] text-xs text-white px-3 rounded-lg border border-white/15 focus:outline-none focus:border-[#0284c7]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingOverlayText(false);
                      setEditTool('none');
                    }}
                    className="min-h-[38px] px-3 rounded-lg bg-[#0284c7] text-white text-xs font-semibold cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#94a3b8]">Posición:</span>
                  <input
                    type="range"
                    min={18}
                    max={85}
                    value={Math.round(overlayTextY * 100)}
                    onChange={(e) => setOverlayTextY(Number(e.target.value) / 100)}
                    className="flex-1 accent-[#38bdf8] h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Caption + Send Footer */}
            <div className="p-4 bg-[#111622] border-t border-white/10 flex flex-col gap-3">
              <input
                id="media-caption-input"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={
                  mediaType === 'video'
                    ? 'Añade un comentario al video...'
                    : 'Añade un comentario a la foto...'
                }
                className="w-full min-h-[42px] bg-[#0b0f17] text-xs text-white placeholder:text-[#64748b] px-3.5 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#0284c7]"
              />

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera(true);
                    onClose();
                  }}
                  disabled={isUploading}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-[#cbd5e1] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!selectedMedia || isUploading}
                  className="flex-1 min-h-[44px] py-2 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subiendo {mediaType === 'video' ? 'video' : 'foto'}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar {mediaType === 'video' ? 'video' : 'foto'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
