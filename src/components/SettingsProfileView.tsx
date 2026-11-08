import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Shield,
  Check,
  Edit3,
  LogIn,
  Trash2,
  AlertTriangle,
  Activity,
  QrCode,
  Sparkles,
  Compass,
  Smartphone,
  Wallpaper as WallpaperIcon,
  Upload,
  Volume2,
  Vibrate,
  Sun,
  Play,
  Square,
  Music,
  Bell,
  PhoneCall,
  MessageSquare,
  FileAudio,
} from 'lucide-react';
import { UserProfile, Wallpaper } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { DEFAULT_PIDGEON_AVATAR, PRESET_AVATARS } from '../utils/avatarUtils';
import { isPhoneTakenByAnotherUser } from '../utils/phoneValidation';
import { PidgeXFullLogo } from './BirdLogo';
import { ProfileQrCardModal } from './ProfileQrCardModal';
import { MONTHLY_THEMES } from '../utils/monthlyThemes';
import {
  CALL_RINGTONE_OPTIONS,
  MESSAGE_TONE_OPTIONS,
  ringtoneManager,
} from '../utils/ringtoneAudio';

interface SettingsProfileViewProps {
  user: UserProfile;
  wallpapers: Wallpaper[];
  firebaseUser?: any;
  isCloudSynced?: boolean;
  isNightMode?: boolean;
  isClassicMode?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onToggleDoNotDisturb?: (duration?: string) => void;
  onApproveFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
  onDeleteAccount?: () => Promise<void> | void;
  onAddScannedContact?: (name: string, username: string) => void;
  onToggleClassicMode?: () => void;
  onOpenTutorial?: () => void;
  onOpenTour?: () => void;
  onOpenInstallModal?: () => void;
  onSelectWallpaper?: (id: string, customUrl?: string) => void;
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({
  user,
  wallpapers,
  firebaseUser,
  isNightMode = false,
  isClassicMode = false,
  onGoogleLogin,
  onGoogleLogout,
  onUpdateUser,
  onDeleteAccount,
  onAddScannedContact,
  onToggleClassicMode,
  onOpenTutorial,
  onOpenTour,
  onOpenInstallModal,
  onSelectWallpaper,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sounds' | 'account'>('profile');
  const [name, setName] = useState<string>(user.name || 'USUARIO NUEVO');
  const [bio, setBio] = useState<string>(user.bio || 'Soy nuevo en PidgeX');
  const [username, setUsername] = useState<string>(user.username || '@usuarionuevo');
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || DEFAULT_PIDGEON_AVATAR);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showQrCardModal, setShowQrCardModal] = useState<boolean>(false);

  // Wallpaper custom upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customInputUrl, setCustomInputUrl] = useState<string>(user.customWallpaperUrl || '');

  // Sound and vibration state
  const callAudioInputRef = useRef<HTMLInputElement>(null);
  const messageAudioInputRef = useRef<HTMLInputElement>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isTestingCallVibration, setIsTestingCallVibration] = useState<boolean>(false);
  const [isTestingMsgVibration, setIsTestingMsgVibration] = useState<boolean>(false);
  const [isTestingWakeScreen, setIsTestingWakeScreen] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      ringtoneManager.stopPreview();
      ringtoneManager.stopCallVibration();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultUrl = event.target.result as string;
          setCustomInputUrl(resultUrl);
          if (onSelectWallpaper) onSelectWallpaper('custom', resultUrl);
          onUpdateUser({ wallpaperId: 'custom', customWallpaperUrl: resultUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCallAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          onUpdateUser({
            callRingtoneId: 'custom',
            customCallRingtoneUrl: dataUrl,
            customCallRingtoneName: file.name,
          });
          ringtoneManager.playTonePreview('call', 'custom', dataUrl);
          setPlayingPreviewId('call_custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessageAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          onUpdateUser({
            messageToneId: 'custom',
            customMessageToneUrl: dataUrl,
            customMessageToneName: file.name,
          });
          ringtoneManager.playTonePreview('message', 'custom', dataUrl);
          setPlayingPreviewId('msg_custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setName(user.name || 'USUARIO NUEVO');
    setBio(user.bio || 'Soy nuevo en PidgeX');
    setUsername(user.username || '@usuarionuevo');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || DEFAULT_PIDGEON_AVATAR);
  }, [user]);

  const handleSaveProfile = async () => {
    setPhoneError(null);
    const finalName = name.trim() ? name.trim() : 'USUARIO NUEVO';
    const finalBio = bio.trim() ? bio.trim() : 'Soy nuevo en PidgeX';
    const finalUsername = username.trim() ? username.trim() : '@usuarionuevo';
    const sanitizedPhone = ensurePhoneStartsWith16(phone);

    const isTaken = await isPhoneTakenByAnotherUser(sanitizedPhone, user.id);
    if (isTaken) {
      setPhoneError('Este número de teléfono ya está registrado');
      return;
    }

    setPhone(sanitizedPhone);
    setName(finalName);
    setBio(finalBio);
    setUsername(finalUsername);

    onUpdateUser({
      name: finalName,
      bio: finalBio,
      username: finalUsername,
      phone: sanitizedPhone,
      avatarUrl: avatarUrl || DEFAULT_PIDGEON_AVATAR,
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleTogglePreview = (type: 'call' | 'message', toneId: string, customUrl?: string) => {
    const key = `${type}_${toneId}`;
    if (playingPreviewId === key) {
      ringtoneManager.stopPreview();
      setPlayingPreviewId(null);
    } else {
      ringtoneManager.playTonePreview(type, toneId, customUrl);
      setPlayingPreviewId(key);
    }
  };

  const handleTestCallVibration = () => {
    setIsTestingCallVibration(true);
    ringtoneManager.startCallVibration();
    setTimeout(() => {
      ringtoneManager.stopCallVibration();
      setIsTestingCallVibration(false);
    }, 2800);
  };

  const handleTestMsgVibration = () => {
    setIsTestingMsgVibration(true);
    ringtoneManager.triggerMessageVibration();
    setTimeout(() => setIsTestingMsgVibration(false), 800);
  };

  const handleTestScreenWake = () => {
    setIsTestingWakeScreen(true);
    ringtoneManager.requestScreenWakeLock();
    setTimeout(() => {
      ringtoneManager.releaseScreenWakeLock();
      setIsTestingWakeScreen(false);
    }, 2500);
  };

  return (
    <div
      className={`flex flex-col w-full h-full min-h-screen ${
        isNightMode ? 'bg-[#0f131c]/75 text-[#dfe2ee]' : 'bg-[#e0f2fe]/75 text-[#0c2340]'
      } backdrop-blur-md relative`}
    >
      {/* Test Screen Wake Flash Overlay */}
      {isTestingWakeScreen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-400/30 animate-pulse duration-500" />
          <div className="relative z-10 px-5 py-3 rounded-2xl bg-black/85 text-emerald-300 font-bold text-xs border border-emerald-400/40 shadow-2xl animate-bounce">
            ☀️ Pantalla despierta y destello luminoso activo
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 h-16 flex items-center justify-between ${
          isNightMode ? 'bg-[#0f131c]/90 border-white/5' : 'bg-white/90 border-sky-200/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-[#38bdf8] flex items-center justify-center text-white shadow-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Ajustes & Configuración</h1>
            <span className="text-[11px] text-[#8d90a0]">Panel de control PidgeX</span>
          </div>
        </div>

        {/* 3 Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/20 dark:bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              ringtoneManager.stopPreview();
              setPlayingPreviewId(null);
              setActiveTab('profile');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => {
              setActiveTab('sounds');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sounds'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Tonos & Alertas</span>
          </button>
          <button
            onClick={() => {
              ringtoneManager.stopPreview();
              setPlayingPreviewId(null);
              setActiveTab('account');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Cuenta
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[620px] w-full mx-auto px-4 py-6 pb-28 flex flex-col gap-6 overflow-y-auto">
        <PidgeXFullLogo />

        {/* TAB 1: PERFIL */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Profile Card */}
            <section className="relative rounded-3xl bg-[#181c24] border border-white/10 p-6 shadow-2xl flex flex-col items-center text-center text-white">
              <div className="relative mb-3">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/40 shadow-2xl"
                />
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl font-black">{name}</h2>
              <span className="text-xs text-blue-400 font-mono mt-0.5">{username}</span>
              <p className="text-xs text-gray-300 mt-2 italic">"{bio}"</p>

              {/* Avatar Picker Preset Drawer */}
              {showAvatarPicker && (
                <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2 w-full animate-in zoom-in-95 duration-150">
                  <span className="text-[11px] font-bold text-[#8d90a0]">Elige un avatar preestablecido</span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((avatar, i) => (
                      <img
                        key={i}
                        src={avatar.url}
                        alt={avatar.name || 'preset'}
                        onClick={() => {
                          setAvatarUrl(avatar.url);
                          onUpdateUser({ avatarUrl: avatar.url });
                          setShowAvatarPicker(false);
                        }}
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-110 border-2 border-transparent hover:border-blue-500 transition-all"
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowQrCardModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Ver Tarjeta QR y Escáner</span>
              </button>
            </section>

            {/* Edit Profile Form */}
            <section className="rounded-3xl bg-[#181c24] border border-white/10 p-5 shadow-xl flex flex-col gap-4 text-white">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Datos</span>
                </span>
                {savedFeedback && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Guardado
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#8d90a0] font-semibold">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#8d90a0] font-semibold">Descripción / Estado</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8d90a0] font-semibold">Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8d90a0] font-semibold">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(null);
                    }}
                    className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  />
                  {phoneError && <span className="text-[10px] text-red-400 font-bold">{phoneError}</span>}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer mt-1"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </section>

            {/* Selector de Fondo de Pantalla Global */}
            <section className="rounded-3xl bg-[#141822] border border-white/10 p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <WallpaperIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Fondo de Pantalla Global</h4>
                  <span className="text-[10px] text-[#8d90a0]">Cambia el fondo de pantalla en todas tus conversaciones</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {wallpapers.map((wp) => {
                  const isSelected = user.wallpaperId === wp.id;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => {
                        if (onSelectWallpaper) {
                          onSelectWallpaper(wp.id);
                        }
                        onUpdateUser({ wallpaperId: wp.id, customWallpaperUrl: '' });
                      }}
                      className={`group relative rounded-2xl overflow-hidden aspect-video border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg scale-98' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={wp.url} alt={wp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-[11px] font-bold text-white truncate">{wp.name}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Image Upload */}
              <div className="mt-2 pt-3 border-t border-white/15 flex flex-col gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir imagen guardada de mi celular</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: TONOS, VIBRACIÓN Y PANTALLA */}
        {activeTab === 'sounds' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Hidden audio file inputs */}
            <input
              type="file"
              ref={callAudioInputRef}
              onChange={handleCallAudioUpload}
              accept="audio/*"
              className="hidden"
            />
            <input
              type="file"
              ref={messageAudioInputRef}
              onChange={handleMessageAudioUpload}
              accept="audio/*"
              className="hidden"
            />

            {/* 1. SECCIÓN DE LLAMADAS ENTRANTES */}
            <section className="rounded-3xl bg-[#141822] border border-emerald-500/30 p-5 shadow-2xl flex flex-col gap-5 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Llamadas Entrantes</h3>
                    <p className="text-[11px] text-[#8d90a0]">Vibración, iluminación de pantalla y tono preferido</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Llamadas PidgeX
                </span>
              </div>

              {/* Toggles: Vibrar y Prender Celular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Toggle Vibrar al llamar */}
                <div className="p-3.5 rounded-2xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Vibrar mi Celular</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ vibrateOnCall: user.vibrateOnCall === false ? true : false })}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.vibrateOnCall !== false ? 'bg-emerald-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.vibrateOnCall !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8d90a0]">
                    Hace vibrar tu teléfono de forma continua mientras suena la llamada entrante.
                  </p>
                  <button
                    onClick={handleTestCallVibration}
                    disabled={isTestingCallVibration}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-emerald-300 border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Vibrate className={`w-3 h-3 ${isTestingCallVibration ? 'animate-bounce' : ''}`} />
                    <span>{isTestingCallVibration ? 'Vibrando prueba...' : 'Probar vibración de llamada'}</span>
                  </button>
                </div>

                {/* Toggle Prender Celular / Pantalla */}
                <div className="p-3.5 rounded-2xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Prender Pantalla / Wake</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ wakeScreenOnCall: user.wakeScreenOnCall === false ? true : false })}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.wakeScreenOnCall !== false ? 'bg-emerald-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.wakeScreenOnCall !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8d90a0]">
                    Enciende la pantalla y muestra destellos visuales para que notes la llamada aunque esté oscuro.
                  </p>
                  <button
                    onClick={handleTestScreenWake}
                    disabled={isTestingWakeScreen}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-amber-300 border border-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sun className="w-3 h-3" />
                    <span>{isTestingWakeScreen ? 'Destellando...' : 'Probar encendido de pantalla'}</span>
                  </button>
                </div>
              </div>

              {/* Selector de Tono de Llamada */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>Tono de Llamada Preferido:</span>
                  </span>
                  <button
                    onClick={() => callAudioInputRef.current?.click()}
                    className="py-1 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-[11px] font-bold shadow flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir audio de mi galería</span>
                  </button>
                </div>

                {/* Custom Audio Banner if active */}
                {user.callRingtoneId === 'custom' && user.customCallRingtoneUrl && (
                  <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/40 flex items-center justify-between gap-2 shadow-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {user.customCallRingtoneName || 'Audio personalizado cargado'}
                        </span>
                        <span className="text-[10px] text-emerald-300">Tono activo desde tus archivos</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePreview('call', 'custom', user.customCallRingtoneUrl)}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer"
                      >
                        {playingPreviewId === 'call_custom' ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => callAudioInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-all cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid of Call Ringtone Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CALL_RINGTONE_OPTIONS.map((opt) => {
                    const isSelected =
                      (user.callRingtoneId || 'pidgex_melody') === opt.id;
                    const isPlaying = playingPreviewId === `call_${opt.id}`;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            if (user.customCallRingtoneUrl) {
                              onUpdateUser({ callRingtoneId: 'custom' });
                            } else {
                              callAudioInputRef.current?.click();
                            }
                          } else {
                            onUpdateUser({ callRingtoneId: opt.id });
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-400 text-white shadow-md'
                            : 'bg-[#181d28] border-white/5 text-[#8d90a0] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{opt.icon}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                            <span className="text-[10px] text-[#8d90a0] truncate">{opt.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (opt.id === 'custom') {
                                if (user.customCallRingtoneUrl) {
                                  handleTogglePreview('call', 'custom', user.customCallRingtoneUrl);
                                } else {
                                  callAudioInputRef.current?.click();
                                }
                              } else {
                                handleTogglePreview('call', opt.id);
                              }
                            }}
                            title={isPlaying ? 'Detener prueba' : 'Escuchar tono'}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isPlaying
                                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                                : 'bg-white/5 hover:bg-white/10 text-emerald-400 border-white/10'
                            }`}
                          >
                            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 2. SECCIÓN DE MENSAJES Y NOTIFICACIONES */}
            <section className="rounded-3xl bg-[#141822] border border-blue-500/30 p-5 shadow-2xl flex flex-col gap-5 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Mensajes y Notificaciones</h3>
                    <p className="text-[11px] text-[#8d90a0]">Vibración al recibir mensaje, pulso de luz y tono de alerta</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  Mensajería PidgeX
                </span>
              </div>

              {/* Toggles: Vibrar y Despertar pantalla con mensajes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Toggle Vibrar al recibir mensaje */}
                <div className="p-3.5 rounded-2xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Vibrar al recibir mensaje</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ vibrateOnMessage: user.vibrateOnMessage === false ? true : false })}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.vibrateOnMessage !== false ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.vibrateOnMessage !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8d90a0]">
                    Emite una doble vibración táctil cuando entra un mensaje de texto, foto o audio.
                  </p>
                  <button
                    onClick={handleTestMsgVibration}
                    disabled={isTestingMsgVibration}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-blue-300 border border-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Vibrate className={`w-3 h-3 ${isTestingMsgVibration ? 'animate-bounce' : ''}`} />
                    <span>{isTestingMsgVibration ? 'Vibrando...' : 'Probar vibración de mensaje'}</span>
                  </button>
                </div>

                {/* Toggle Despertar pantalla al recibir mensaje */}
                <div className="p-3.5 rounded-2xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white">Prender Pantalla con Mensaje</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ wakeScreenOnMessage: user.wakeScreenOnMessage === false ? true : false })}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.wakeScreenOnMessage !== false ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.wakeScreenOnMessage !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8d90a0]">
                    Despierta la pantalla momentáneamente con un pulso de luz al entrar un nuevo mensaje.
                  </p>
                  <button
                    onClick={handleTestScreenWake}
                    disabled={isTestingWakeScreen}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-sky-300 border border-sky-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Probar pulso en pantalla</span>
                  </button>
                </div>
              </div>

              {/* Selector de Tono de Mensajes */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span>Tono de Notificación de Mensaje:</span>
                  </span>
                  <button
                    onClick={() => messageAudioInputRef.current?.click()}
                    className="py-1 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white text-[11px] font-bold shadow flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir audio de mi galería</span>
                  </button>
                </div>

                {/* Custom Audio Banner if active for message */}
                {user.messageToneId === 'custom' && user.customMessageToneUrl && (
                  <div className="p-3 rounded-2xl bg-blue-950/70 border border-blue-400/40 flex items-center justify-between gap-2 shadow-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {user.customMessageToneName || 'Audio de mensaje cargado'}
                        </span>
                        <span className="text-[10px] text-blue-300">Tono activo para mensajes entrantes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePreview('message', 'custom', user.customMessageToneUrl)}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow transition-all cursor-pointer"
                      >
                        {playingPreviewId === 'msg_custom' ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => messageAudioInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-all cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid of Message Tone Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MESSAGE_TONE_OPTIONS.map((opt) => {
                    const isSelected =
                      (user.messageToneId || 'pidgex_chirp') === opt.id;
                    const isPlaying = playingPreviewId === `message_${opt.id}`;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            if (user.customMessageToneUrl) {
                              onUpdateUser({ messageToneId: 'custom' });
                            } else {
                              messageAudioInputRef.current?.click();
                            }
                          } else {
                            onUpdateUser({ messageToneId: opt.id });
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-400 text-white shadow-md'
                            : 'bg-[#181d28] border-white/5 text-[#8d90a0] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{opt.icon}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                            <span className="text-[10px] text-[#8d90a0] truncate">{opt.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (opt.id === 'custom') {
                                if (user.customMessageToneUrl) {
                                  handleTogglePreview('message', 'custom', user.customMessageToneUrl);
                                } else {
                                  messageAudioInputRef.current?.click();
                                }
                              } else {
                                handleTogglePreview('message', opt.id);
                              }
                            }}
                            title={isPlaying ? 'Detener prueba' : 'Escuchar tono'}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isPlaying
                                ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                                : 'bg-white/5 hover:bg-white/10 text-blue-400 border-white/10'
                            }`}
                          >
                            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: CUENTA & NUBE */}
        {activeTab === 'account' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Status Selector */}
            <section className="rounded-3xl bg-[#181c24] border border-white/10 p-5 shadow-xl flex flex-col gap-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5 pb-2 border-b border-white/10">
                <Activity className="w-4 h-4" />
                <span>Estado de Conexión</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'online', label: '🟢 En línea' },
                  { id: 'busy', label: '🟡 Ocupado' },
                  { id: 'offline', label: '⚪ Offline' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdateUser({ status: s.id as any })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      user.status === s.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-[#121620] border-white/10 text-[#8d90a0] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Selector de Tema Festivo Mensual */}
            <section className="rounded-3xl bg-[#141822] border border-white/10 p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tema Festivo Mensual</h4>
                  <span className="text-[10px] text-[#8d90a0]">Elige la festividad activa de tus chats y banners</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => onUpdateUser({ monthlyTheme: 'auto' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    !user.monthlyTheme || user.monthlyTheme === 'auto'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-[#1c2028] border-white/5 text-[#8d90a0] hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>📅</span>
                    <span>Automático</span>
                  </div>
                  <span className="text-[10px] opacity-80 mt-0.5 block">Sigue el calendario real</span>
                </button>

                {MONTHLY_THEMES.map((theme) => {
                  const isSelected = user.monthlyTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateUser({ monthlyTheme: theme.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                          : 'bg-[#1c2028] border-white/5 text-[#8d90a0] hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                        <span>{theme.icon}</span>
                        <span className="truncate">{theme.name}</span>
                      </div>
                      <span className="text-[10px] opacity-80 mt-0.5 block truncate">{theme.festivityName}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Cloud Sync */}
            <section className="rounded-3xl bg-gradient-to-br from-[#122033] via-[#151c28] to-[#0d1420] border border-cyan-500/30 p-5 shadow-xl flex flex-col gap-3 text-white">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Firebase Cloud Sync</h4>
                    <span className="text-[10px] text-cyan-300">
                      {firebaseUser ? '🟢 Sincronizado en la nube' : '⚪ Modo local'}
                    </span>
                  </div>
                </div>
                {firebaseUser ? (
                  <button
                    onClick={onGoogleLogout}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <button
                    onClick={onGoogleLogin}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Conectar Google</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Tus conversaciones, contactos, juegos y estado se guardan de forma segura para acceder desde cualquier dispositivo.
              </p>
            </section>

            {/* Volver a modo clásico */}
            <div className="mt-2">
              <button
                onClick={() => {
                  if (onToggleClassicMode) {
                    onToggleClassicMode();
                  } else {
                    localStorage.setItem('pidge_classic_mode', 'true');
                    window.location.reload();
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isClassicMode ? 'Volver a Modo Completo (PidgeX Pro)' : 'Volver a Modo Clásico (Versión Inicial)'}</span>
              </button>
            </div>

            {/* Ver Tutorial Interactivo */}
            <div className="mt-2">
              <button
                onClick={() => onOpenTutorial?.()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ver Tutorial Interactivo de PidgeX</span>
              </button>
            </div>

            {/* Guía Interactiva en Pantalla (Tour) */}
            <div className="mt-2">
              <button
                onClick={() => onOpenTour?.()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Iniciar Guía Interactiva con Flechitas</span>
              </button>
            </div>

            {/* Instalar PWA */}
            {onOpenInstallModal && (
              <div className="mt-2">
                <button
                  onClick={onOpenInstallModal}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Instalar PidgeX en Celular y Tablet 📱</span>
                </button>
              </div>
            )}

            {/* Danger Zone: Delete Account */}
            <section className="rounded-3xl bg-red-950/20 border border-red-500/30 p-5 shadow-xl flex items-center justify-between mt-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-red-400">Eliminar Cuenta</span>
                <span className="text-[10px] text-[#8d90a0]">Borrar todos los datos y perfil permanentemente</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full rounded-3xl bg-[#181c24] border border-red-500/30 p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">¿Eliminar cuenta permanentemente?</h3>
                <span className="text-[11px] text-red-400 font-medium">Esta acción no se puede deshacer</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#8d90a0]">
                Escribe <strong className="text-red-400">BORRAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="BORRAR"
                className="bg-[#121620] text-xs text-white px-3 py-2.5 rounded-xl border border-red-500/30 focus:outline-none focus:border-red-500 uppercase tracking-widest font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-black/20 hover:bg-black/40 text-xs font-semibold text-[#8d90a0] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'BORRAR' || isDeleting}
                onClick={async () => {
                  if (onDeleteAccount) {
                    try {
                      setIsDeleting(true);
                      await onDeleteAccount();
                      setShowDeleteModal(false);
                    } catch {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Card Modal */}
      <ProfileQrCardModal
        isOpen={showQrCardModal}
        onClose={() => setShowQrCardModal(false)}
        user={user}
        isNightMode={isNightMode}
        onAddScannedContact={onAddScannedContact}
      />
    </div>
  );
};
