import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  AtSign,
  FileText,
  Lock,
  Phone,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BirdLogo } from './BirdLogo';
import { PRESET_AVATARS } from '../utils/avatarUtils';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';

export interface AccountRegistrationPayload {
  name: string;
  username: string;
  bio: string;
  phone: string;
  passwordHash: string;
  avatarUrl: string;
}

interface AccountOnboardingViewProps {
  onCompleteAccount: (payload: AccountRegistrationPayload) => Promise<void> | void;
  isNightMode?: boolean;
}

function cropAvatarToSquare(dataUrl: string, size = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function hashPasswordSha256(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`pidgex_v1_${password}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback digest if subtle crypto is unavailable in non-secure context
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

export const AccountOnboardingView: React.FC<AccountOnboardingViewProps> = ({
  onCompleteAccount,
  isNightMode = false,
}) => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen]);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Tu navegador no permite usar la cámara aquí. Puedes subir una foto o elegir un avatar.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraFacing(facing);
      setIsCameraOpen(true);
    } catch {
      setCameraError('No pudimos acceder a la cámara. Verifica los permisos o sube una foto de tu galería.');
    }
  };

  const handleCaptureSelfie = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 640;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (cameraFacing === 'user') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      setIsProcessingPhoto(true);
      const cropped = await cropAvatarToSquare(canvas.toDataURL('image/jpeg', 0.9), 400);
      setAvatarUrl(cropped);
      setErrors((prev) => ({ ...prev, avatarUrl: '' }));
      setIsProcessingPhoto(false);
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const cropped = await cropAvatarToSquare(reader.result, 400);
        setAvatarUrl(cropped);
        setErrors((prev) => ({ ...prev, avatarUrl: '' }));
      }
      setIsProcessingPhoto(false);
    };
    reader.onerror = () => setIsProcessingPhoto(false);
    reader.readAsDataURL(file);
  };

  const normalizedUsername = (() => {
    const clean = username.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
    return clean ? `@${clean}` : '';
  })();

  const phoneDigitsOnly = phoneInput.replace(/\D/g, '');
  const formattedPidgePhone = phoneDigitsOnly.length >= 6 ? ensurePhoneStartsWith16(phoneInput) : '';

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!avatarUrl) {
      nextErrors.avatarUrl = 'Sube una foto de perfil, tómate una selfie o elige un avatar.';
    }
    if (name.trim().length < 2) {
      nextErrors.name = 'Ingresa tu nombre completo (mínimo 2 letras).';
    }
    const cleanUser = username.trim().replace(/^@+/, '').replace(/\s+/g, '');
    if (cleanUser.length < 3 || !/^[a-zA-Z0-9._]+$/.test(cleanUser)) {
      nextErrors.username = 'El usuario debe tener al menos 3 caracteres (solo letras, números, puntos o _).';
    }
    if (bio.trim().length < 3) {
      nextErrors.bio = 'Escribe una breve descripción para tu perfil.';
    }
    if (phoneDigitsOnly.length < 8) {
      nextErrors.phone = 'Ingresa un teléfono válido de al menos 8 dígitos.';
    }
    if (password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let finalAvatar = avatarUrl;
      if (avatarUrl.startsWith('data:image/')) {
        try {
          const uploadRes = await fetch('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: avatarUrl,
              filename: `avatar_${Date.now()}.jpg`,
            }),
          });
          if (uploadRes.ok) {
            const uploaded = await uploadRes.json();
            if (uploaded.mediaUrl) {
              finalAvatar = uploaded.mediaUrl;
            }
          }
        } catch {
          // Keep cropped base64 locally if media upload is offline
        }
      }

      const passwordHash = await hashPasswordSha256(password);
      const finalPhone = ensurePhoneStartsWith16(phoneInput);

      await onCompleteAccount({
        name: name.trim(),
        username: normalizedUsername,
        bio: bio.trim(),
        phone: finalPhone,
        passwordHash,
        avatarUrl: finalAvatar,
      });
    } catch (err) {
      console.error('Error creating account:', err);
      setSubmitError('No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-y-auto overscroll-contain flex items-start lg:items-center justify-center px-4 py-6 sm:px-6 lg:px-10 ${
        isNightMode
          ? 'bg-[#0a0e16] text-[#eef2f8]'
          : 'bg-[#eff6ff] text-[#0c2340]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start my-auto">
        {/* Left Column: Brand & Live Profile Card Preview */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-8">
          <div className="flex items-center gap-3.5">
            <BirdLogo size={52} withBackground />
            <div className="min-w-0">
              <h1
                id="onboarding-title"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance"
              >
                Bienvenido a PidgeX
              </h1>
              <p className={`text-sm mt-0.5 ${isNightMode ? 'text-[#94a3b8]' : 'text-[#475569]'}`}>
                Crea tu cuenta obligatoria para empezar a chatear y llamar.
              </p>
            </div>
          </div>

          {/* Live Profile Preview */}
          <div
            className={`rounded-3xl p-5 border transition-colors ${
              isNightMode
                ? 'bg-[#121722] border-white/10 shadow-xl shadow-black/30'
                : 'bg-white border-sky-200/80 shadow-lg shadow-sky-900/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-4">
              <span className={isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}>
                Vista previa de tu perfil
              </span>
              <span className="inline-flex items-center gap-1 text-[#0284c7] dark:text-[#38bdf8]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cuenta nueva</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 flex items-center justify-center ${
                  avatarUrl
                    ? 'border-[#0ea5e9]'
                    : isNightMode
                    ? 'border-dashed border-white/25 bg-[#1b2230]'
                    : 'border-dashed border-sky-300 bg-sky-50'
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil seleccionada"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className={`w-8 h-8 ${isNightMode ? 'text-[#64748b]' : 'text-sky-400'}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold truncate">
                  {name.trim() || 'Tu Nombre'}
                </p>
                <p className={`text-sm truncate ${isNightMode ? 'text-[#38bdf8]' : 'text-[#0284c7]'}`}>
                  {normalizedUsername || '@tuusuario'}
                </p>
                <p className={`text-xs mt-1 truncate ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  {formattedPidgePhone || '16 · · · · · · · ·'}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 pt-3.5 border-t text-sm leading-relaxed ${
                isNightMode ? 'border-white/10 text-[#cbd5e1]' : 'border-slate-100 text-[#334155]'
              }`}
            >
              {bio.trim() || 'Aquí aparecerá tu descripción personal para tus amigos.'}
            </div>
          </div>

          <div
            className={`hidden lg:flex flex-col gap-2 text-xs leading-relaxed ${
              isNightMode ? 'text-[#94a3b8]' : 'text-[#475569]'
            }`}
          >
            <span>• Todos los campos son necesarios para proteger tu cuenta.</span>
            <span>• Tu contraseña se cifra localmente antes de guardar tu sesión.</span>
            <span>• Tu número en PidgeX inicia con 16 para recibir llamadas y chats.</span>
          </div>
        </div>

        {/* Right Column: Mandatory Account Registration Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className={`lg:col-span-7 rounded-3xl p-5 sm:p-7 border flex flex-col gap-5 ${
            isNightMode
              ? 'bg-[#121722] border-white/10 shadow-2xl shadow-black/40'
              : 'bg-white border-sky-200/80 shadow-xl shadow-sky-900/10'
          }`}
        >
          <div>
            <h2 className="text-xl font-bold tracking-tight">Crear cuenta en PidgeX</h2>
            <p className={`text-xs mt-1 ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              Completa tus datos para continuar. Este paso es obligatorio la primera vez.
            </p>
          </div>

          {/* 1. Foto de Perfil */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold flex items-center justify-between">
              <span>Foto de perfil *</span>
              {avatarUrl && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <Check className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </span>
              )}
            </label>

            {isCameraOpen ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video max-h-60 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacing === 'user' ? 'environment' : 'user')}
                    className="min-h-[44px] min-w-[44px] px-3 rounded-full bg-black/70 text-white border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/90"
                    title="Cambiar cámara"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="min-h-[44px] px-5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="min-h-[44px] min-w-[44px] px-3 rounded-full bg-black/70 text-white border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/90"
                    title="Cerrar cámara"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 flex items-center justify-center ${
                    errors.avatarUrl
                      ? 'border-red-500 bg-red-500/10'
                      : avatarUrl
                      ? 'border-[#2563eb]'
                      : isNightMode
                      ? 'border-white/15 bg-[#1b2230]'
                      : 'border-sky-200 bg-sky-50'
                  }`}
                >
                  {isProcessingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Tu foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className={`w-7 h-7 ${isNightMode ? 'text-[#64748b]' : 'text-sky-500'}`} />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
                      isNightMode
                        ? 'bg-[#1b2230] hover:bg-[#242d3f] border-white/10 text-white'
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-[#0c2340]'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-[#0284c7]" />
                    <span>Subir foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCamera('user')}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
                      isNightMode
                        ? 'bg-[#1b2230] hover:bg-[#242d3f] border-white/10 text-white'
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-[#0c2340]'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-[#0284c7]" />
                    <span>Tomar selfie</span>
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{cameraError}</span>
              </p>
            )}

            {/* Quick Avatar Selection */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-xs ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                O elige un avatar rápido:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {PRESET_AVATARS.map((av) => {
                  const selected = avatarUrl === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(av.url);
                        setErrors((prev) => ({ ...prev, avatarUrl: '' }));
                      }}
                      title={av.name}
                      className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-transform cursor-pointer active:scale-95 ${
                        selected
                          ? 'border-[#2563eb] ring-2 ring-[#38bdf8]/50 scale-105'
                          : isNightMode
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-slate-200 hover:border-sky-400'
                      }`}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            {errors.avatarUrl && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.avatarUrl}</span>
              </p>
            )}
          </div>

          {/* 2 & 3. Nombre y Usuario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-sm font-semibold">
                Nombre *
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isNightMode ? 'text-[#64748b]' : 'text-[#64748b]'}`} />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ej. Sofía Ramírez"
                  maxLength={60}
                  required
                  className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                    errors.name
                      ? 'border-red-500'
                      : isNightMode
                      ? 'bg-[#1a202c] border-white/10 text-white placeholder-[#64748b]'
                      : 'bg-slate-50 border-slate-200 text-[#0c2340] placeholder-slate-400'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-username" className="text-sm font-semibold">
                Usuario *
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/\s+/g, ''));
                    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  placeholder="sofiaramirez"
                  maxLength={32}
                  required
                  className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                    errors.username
                      ? 'border-red-500'
                      : isNightMode
                      ? 'bg-[#1a202c] border-white/10 text-white placeholder-[#64748b]'
                      : 'bg-slate-50 border-slate-200 text-[#0c2340] placeholder-slate-400'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.username}</span>
                </p>
              )}
            </div>
          </div>

          {/* 4. Descripción */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-bio" className="text-sm font-semibold flex items-center justify-between">
              <span>Descripción *</span>
              <span className={`text-xs font-normal ${isNightMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                {bio.length}/160
              </span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-[#64748b]" />
              <textarea
                id="reg-bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors((prev) => ({ ...prev, bio: '' }));
                }}
                placeholder="Cuéntale a tus amigos quién eres o qué te gusta..."
                maxLength={160}
                rows={2}
                required
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                  errors.bio
                    ? 'border-red-500'
                    : isNightMode
                    ? 'bg-[#1a202c] border-white/10 text-white placeholder-[#64748b]'
                    : 'bg-slate-50 border-slate-200 text-[#0c2340] placeholder-slate-400'
                }`}
              />
            </div>
            {errors.bio && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bio}</span>
              </p>
            )}
          </div>

          {/* 5 & 6. Teléfono y Contraseña */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-phone" className="text-sm font-semibold">
                Teléfono *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="16 612 345 678"
                  maxLength={22}
                  required
                  className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                    errors.phone
                      ? 'border-red-500'
                      : isNightMode
                      ? 'bg-[#1a202c] border-white/10 text-white placeholder-[#64748b]'
                      : 'bg-slate-50 border-slate-200 text-[#0c2340] placeholder-slate-400'
                  }`}
                />
              </div>
              {formattedPidgePhone && !errors.phone && (
                <p className={`text-xs ${isNightMode ? 'text-[#38bdf8]' : 'text-[#0284c7]'}`}>
                  Tu número PidgeX será: <span className="font-semibold tabular-nums">{formattedPidgePhone}</span>
                </p>
              )}
              {errors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-sm font-semibold">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Mínimo 6 caracteres"
                  maxLength={64}
                  required
                  className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                    errors.password
                      ? 'border-red-500'
                      : isNightMode
                      ? 'bg-[#1a202c] border-white/10 text-white placeholder-[#64748b]'
                      : 'bg-slate-50 border-slate-200 text-[#0c2340] placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#2563eb] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] mt-1 px-6 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando tu cuenta...</span>
              </>
            ) : (
              <>
                <span>Crear mi cuenta y entrar a PidgeX</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
