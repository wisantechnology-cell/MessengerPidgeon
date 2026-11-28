import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Shield,
  Check,
  Edit3,
  LogOut,
  Trash2,
  AlertTriangle,
  Activity,
  Compass,
  Smartphone,
  Laptop,
  Tablet,
  RefreshCw,
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
  Calendar,
  BookOpen,
  Sparkles,
  Wand2,
  BellRing,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { UserProfile, Wallpaper } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { DEFAULT_PIDGEON_AVATAR } from '../utils/avatarUtils';
import { isPhoneTakenByAnotherUser } from '../utils/phoneValidation';
import { PidgeXFullLogo } from './BirdLogo';
import { AvatarCaptureModal } from './AvatarCaptureModal';
import { DigitalAvatarStudioModal } from './DigitalAvatarStudioModal';
import { AiStickerFactoryModal } from './AiStickerFactoryModal';
import { ProfilePhotoshopEditorModal } from './ProfilePhotoshopEditorModal';
import { MONTHLY_THEMES } from '../utils/monthlyThemes';
import {
  CALL_RINGTONE_OPTIONS,
  MESSAGE_TONE_OPTIONS,
  ringtoneManager,
} from '../utils/ringtoneAudio';
import {
  getPushSubscriptionStatus,
  PushStatusSummary,
  registerPushSubscription,
  sendTestPushNotification,
} from '../utils/pushManager';
import { sendNativeMessageNotification } from '../utils/nativeNotifications';

interface SettingsProfileViewProps {
  user: UserProfile;
  wallpapers: Wallpaper[];
  isNightMode?: boolean;
  isClassicMode?: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onToggleDoNotDisturb?: (duration?: string) => void;
  onApproveFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
  onSignOut?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<void> | void;
  onToggleClassicMode?: () => void;
  onOpenTutorial?: () => void;
  onOpenTour?: () => void;
  onOpenInstallModal?: () => void;
  onSelectWallpaper?: (id: string, customUrl?: string) => void;
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({
  user,
  wallpapers,
  isNightMode = false,
  isClassicMode = false,
  onUpdateUser,
  onSignOut,
  onDeleteAccount,
  onToggleClassicMode,
  onOpenTutorial,
  onOpenTour,
  onOpenInstallModal,
  onSelectWallpaper,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'device' | 'sounds' | 'account'>('profile');
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
  const [showAvatarStudio, setShowAvatarStudio] = useState<boolean>(false);
  const [showStickerFactory, setShowStickerFactory] = useState<boolean>(false);
  const [showPhotoshopEditor, setShowPhotoshopEditor] = useState<boolean>(false);

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

  // Push notification status & tests
  const [pushStatus, setPushStatus] = useState<PushStatusSummary | null>(null);
  const [isSyncingPush, setIsSyncingPush] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [testCallCountdown, setTestCallCountdown] = useState<number>(0);

  const refreshPushStatus = async () => {
    const status = await getPushSubscriptionStatus(user.phone, user.id);
    setPushStatus(status);
  };

  useEffect(() => {
    if (activeTab === 'sounds') {
      refreshPushStatus();
    }
  }, [activeTab, user.phone, user.id]);

  useEffect(() => {
    if (testCallCountdown <= 0) return;
    const t = setTimeout(() => setTestCallCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [testCallCountdown]);

  const handleActivatePush = async () => {
    setIsSyncingPush(true);
    setPushFeedback(null);
    try {
      const res = await registerPushSubscription(user.phone, user.id, true);
      await refreshPushStatus();
      if (res.ok && res.permission === 'granted') {
        ringtoneManager.triggerMessageVibration();
        setPushFeedback('Notificaciones y llamadas en segundo plano activadas en este celular.');
      } else if (res.permission === 'denied') {
        setPushFeedback('El navegador tiene bloqueadas las notificaciones. Habilítalas en Ajustes del sitio.');
      } else {
        setPushFeedback('Permiso pendiente. Acepta el aviso de notificaciones o instala la app en Inicio.');
      }
    } finally {
      setIsSyncingPush(false);
    }
  };

  const handleTestMessagePush = async () => {
    setPushFeedback(null);
    const res = await sendTestPushNotification({
      kind: 'message',
      delaySeconds: 0,
      userPhone: user.phone,
      userId: user.id,
      userName: user.name,
    });
    // Also trigger immediate native message notification so user hears their phone's own system sound even with app open
    await sendNativeMessageNotification(
      'PidgeX • Mensaje de Prueba',
      'Sonido configurado en tu celular + vibración activos.',
      undefined,
      'test_msg_settings',
      user
    );
    await refreshPushStatus();
    setPushFeedback(
      res.ok
        ? 'Prueba enviada: debería vibrar y sonar con el tono de tu celular.'
        : 'Notificación local enviada. Activa las notificaciones para recibirlas con la app cerrada.'
    );
  };

  const handleTestCallPush = async () => {
    if (testCallCountdown > 0) return;
    setPushFeedback(null);
    const res = await sendTestPushNotification({
      kind: 'call',
      delaySeconds: 5,
      userPhone: user.phone,
      userId: user.id,
      userName: user.name,
    });
    await refreshPushStatus();
    if (res.ok) {
      setTestCallCountdown(5);
      setPushFeedback('Sal de la app o apaga la pantalla ahora: la llamada llegará en 5 segundos.');
    } else {
      setPushFeedback(res.error || 'Primero activa las notificaciones para probar la llamada en segundo plano.');
    }
  };

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

  const uploadAudioFileToMedia = async (file: File): Promise<string> => {
    try {
      const response = await fetch(
        `/api/media/upload-raw?filename=${encodeURIComponent(file.name || 'ringtone.mp3')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'audio/mpeg',
          },
          body: file,
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.mediaUrl) {
          return data.mediaUrl as string;
        }
      }
    } catch (err) {
      console.warn('Audio raw upload fallback to DataURL:', err);
    }

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) resolve(event.target.result as string);
        else reject(new Error('No file data'));
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const handleCallAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const audioUrl = await uploadAudioFileToMedia(file);
      onUpdateUser({
        callRingtoneId: 'custom',
        customCallRingtoneUrl: audioUrl,
        customCallRingtoneName: file.name,
      });
      ringtoneManager.playTonePreview('call', 'custom', audioUrl);
      setPlayingPreviewId('call_custom');
    } catch (err) {
      console.warn('Call audio upload failed:', err);
    }
  };

  const handleMessageAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const audioUrl = await uploadAudioFileToMedia(file);
      onUpdateUser({
        messageToneId: 'custom',
        customMessageToneUrl: audioUrl,
        customMessageToneName: file.name,
      });
      ringtoneManager.playTonePreview('message', 'custom', audioUrl);
      setPlayingPreviewId('message_custom');
    } catch (err) {
      console.warn('Message audio upload failed:', err);
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

  const cardCls = isNightMode
    ? 'bg-[#161b24] border-white/10 text-white'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const inputCls = isNightMode
    ? 'bg-[#0f131c] border-white/10 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const mutedTextCls = isNightMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`flex flex-col w-full h-full min-h-screen relative ${
        isNightMode ? 'bg-[#0f131c] text-[#dfe2ee]' : 'bg-[#f4f7fb] text-[#0c2340]'
      }`}
    >
      {/* Test Screen Wake Flash Overlay */}
      {isTestingWakeScreen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-400/20" />
          <div className="relative z-10 px-5 py-3 rounded-xl bg-slate-900 text-emerald-300 font-semibold text-xs border border-emerald-400/30 shadow-xl">
            Pantalla encendida para prueba de llamada
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 ${
          isNightMode ? 'bg-[#141923] border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0284c7] flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Ajustes</h1>
            <span className={`text-[11px] ${mutedTextCls}`}>{username}</span>
          </div>
        </div>

        {/* 4 Tab Switcher */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto no-scrollbar ${
            isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => {
              ringtoneManager.stopPreview();
              setPlayingPreviewId(null);
              setActiveTab('profile');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#0284c7] text-white'
                : isNightMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => {
              ringtoneManager.stopPreview();
              setPlayingPreviewId(null);
              setActiveTab('device');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'device'
                ? 'bg-[#0284c7] text-white'
                : isNightMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Dispositivo</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('sounds');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sounds'
                ? 'bg-[#0284c7] text-white'
                : isNightMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notificaciones</span>
          </button>
          <button
            onClick={() => {
              ringtoneManager.stopPreview();
              setPlayingPreviewId(null);
              setActiveTab('account');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-[#0284c7] text-white'
                : isNightMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cuenta
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[620px] w-full mx-auto px-4 py-5 pb-28 flex flex-col gap-5 overflow-y-auto">
        <PidgeXFullLogo showSlogan />

        {/* TAB 1: PERFIL */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Profile Card */}
            <section className={`relative rounded-2xl border p-5 flex flex-col items-center text-center ${cardCls}`}>
              <div className="relative mb-3">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-slate-200 dark:ring-white/15"
                />
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  title="Cambiar foto de perfil"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer ring-2 ring-white dark:ring-[#161b24]"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold">{name}</h2>
              <span className="text-xs text-[#0284c7] dark:text-[#38bdf8] font-medium mt-0.5">{username}</span>
              <p className={`text-xs mt-1.5 ${mutedTextCls}`}>{bio}</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isNightMode
                      ? 'bg-[#0f131c] border-white/10 hover:bg-white/5 text-white'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Cambiar foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAvatarStudio(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mi Avatar Digital IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowStickerFactory(true)}
                  className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Fábrica de Stickers IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhotoshopEditor(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Editor Photoshop (Fondos)</span>
                </button>
              </div>

              <div className={`mt-4 pt-3 border-t w-full flex items-center justify-center gap-4 text-xs ${isNightMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                <span className="font-semibold">
                  {(user.customStickerPacks || []).length} paquetes de stickers IA
                </span>
              </div>
            </section>

            {/* Edit Profile Form */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-4 ${cardCls}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar perfil</span>
                </span>
                {savedFeedback && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Guardado
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-semibold ${mutedTextCls}`}>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#0284c7] ${inputCls}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-semibold ${mutedTextCls}`}>Descripción</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#0284c7] resize-none ${inputCls}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold ${mutedTextCls}`}>Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#0284c7] ${inputCls}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold ${mutedTextCls}`}>Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(null);
                    }}
                    className={`text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:border-[#0284c7] ${inputCls}`}
                  />
                  {phoneError && <span className="text-[11px] text-red-500 font-medium">{phoneError}</span>}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
              >
                <Check className="w-4 h-4" />
                <span>Guardar cambios</span>
              </button>
            </section>

            {/* Selector de Fondo de Pantalla Global */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-3 ${cardCls}`}>
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center">
                  <WallpaperIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Fondo de pantalla global</h4>
                  <span className={`text-[11px] ${mutedTextCls}`}>Se aplica en todas tus conversaciones</span>
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
                      className={`group relative rounded-xl overflow-hidden aspect-video border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-[#0284c7]' : 'border-transparent hover:border-slate-300 dark:hover:border-white/25'
                      }`}
                    >
                      <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/35 flex items-end p-2">
                        <span className="text-[11px] font-semibold text-white truncate">{wp.name}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Image Upload */}
              <div className="mt-1 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir imagen desde mi dispositivo</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DISPOSITIVO & PANTALLA */}
        {activeTab === 'device' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <section className={`rounded-2xl border p-5 flex flex-col gap-4 ${cardCls}`}>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-[#0284c7] flex items-center justify-center text-white shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Diseño según dispositivo</h3>
                  <p className={`text-xs ${mutedTextCls}`}>
                    Adapta botones y paneles al tamaño de tu pantalla.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'mobile',
                    title: 'Celular',
                    tag: 'Compacto',
                    icon: <Smartphone className="w-5 h-5 text-[#0284c7]" />,
                    desc: 'Controles cómodos para usar con una mano y menús simples.',
                  },
                  {
                    id: 'desktop',
                    title: 'Computadora',
                    tag: 'Amplio',
                    icon: <Laptop className="w-5 h-5 text-[#0284c7]" />,
                    desc: 'Vista pensada para pantallas grandes con teclado y ratón.',
                  },
                  {
                    id: 'tablet',
                    title: 'Tablet',
                    tag: 'Híbrido',
                    icon: <Tablet className="w-5 h-5 text-[#0284c7]" />,
                    desc: 'Balanceado para formato horizontal o vertical.',
                  },
                  {
                    id: 'auto',
                    title: 'Automático',
                    tag: 'Recomendado',
                    icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
                    desc: 'Se ajusta automáticamente al tamaño actual de tu ventana.',
                  },
                ].map((item) => {
                  const currentMode = user.deviceMode || 'auto';
                  const isSelected = currentMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onUpdateUser({ deviceMode: item.id as any });
                        setSavedFeedback(true);
                        setTimeout(() => setSavedFeedback(false), 2000);
                      }}
                      className={`relative flex flex-col p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? isNightMode
                            ? 'bg-[#0284c7]/15 border-[#0284c7]'
                            : 'bg-sky-50 border-[#0284c7]'
                          : isNightMode
                          ? 'bg-[#0f131c] border-white/10 hover:border-white/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isNightMode ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
                          {item.icon}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#0284c7] text-white'
                              : isNightMode
                              ? 'bg-white/10 text-slate-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#0284c7]" />}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${mutedTextCls}`}>
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-xs ${mutedTextCls}`}>
                  Modo actual:{' '}
                  <strong className={isNightMode ? 'text-white' : 'text-slate-900'}>
                    {user.deviceMode === 'mobile'
                      ? 'Celular'
                      : user.deviceMode === 'desktop'
                      ? 'Computadora'
                      : user.deviceMode === 'tablet'
                      ? 'Tablet'
                      : 'Automático'}
                  </strong>
                </span>
                {savedFeedback && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Guardado
                  </span>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: TONOS, VIBRACIÓN Y PANTALLA */}
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

            {/* 0. CENTRO DE NOTIFICACIONES Y LLAMADAS EN SEGUNDO PLANO (ESTILO WHATSAPP) */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-4 ${cardCls}`}>
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Notificaciones y Llamadas en Segundo Plano</h3>
                    <p className={`text-[11px] ${mutedTextCls}`}>
                      Enciende tu pantalla, vibra y suena con el tono de tu celular aunque la app esté cerrada.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleActivatePush}
                  disabled={isSyncingPush}
                  className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPush ? 'animate-spin' : ''}`} />
                  <span>{pushStatus?.serverSubscribed ? 'Reconectar' : 'Activar ahora'}</span>
                </button>
              </div>

              {/* Status grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  className={`p-3 rounded-xl border ${
                    isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${mutedTextCls}`}>
                    Permiso del celular
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 flex items-center gap-1.5 ${
                      pushStatus?.permission === 'granted'
                        ? 'text-emerald-500'
                        : pushStatus?.permission === 'denied'
                        ? 'text-rose-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {pushStatus?.permission === 'granted' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concedido
                      </>
                    ) : pushStatus?.permission === 'denied' ? (
                      'Bloqueado'
                    ) : (
                      'Sin activar'
                    )}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${mutedTextCls}`}>
                    Llamadas app cerrada
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 flex items-center gap-1.5 ${
                      pushStatus?.serverSubscribed ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {pushStatus?.serverSubscribed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado ({pushStatus.devicesCount || 1})
                      </>
                    ) : (
                      'Toca Activar ahora'
                    )}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${mutedTextCls}`}>
                    App instalada
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 flex items-center gap-1.5 ${
                      pushStatus?.standalone ? 'text-emerald-500' : 'text-sky-500'
                    }`}
                  >
                    {pushStatus?.standalone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> En pantalla de inicio
                      </>
                    ) : (
                      'Modo navegador'
                    )}
                  </p>
                </div>
              </div>

              {/* Action / Test buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleTestMessagePush}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isNightMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-sky-300'
                      : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Probar mensaje (sonido del celular)</span>
                </button>

                <button
                  onClick={handleTestCallPush}
                  disabled={testCallCountdown > 0}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isNightMode
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>
                    {testCallCountdown > 0
                      ? `Bloquea tu pantalla (${testCallCountdown}s)...`
                      : 'Probar llamada con app cerrada (5s)'}
                  </span>
                </button>
              </div>

              {!pushStatus?.standalone && onOpenInstallModal && (
                <button
                  onClick={onOpenInstallModal}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isNightMode
                      ? 'bg-[#0f131c] hover:bg-white/5 border-white/10 text-slate-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Instalar PidgeX en tu celular para máxima estabilidad</span>
                </button>
              )}

              {pushFeedback && (
                <p
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    isNightMode
                      ? 'bg-sky-950/50 border-sky-500/25 text-sky-200'
                      : 'bg-sky-50 border-sky-200 text-sky-900'
                  }`}
                >
                  {pushFeedback}
                </p>
              )}
            </section>

            {/* 1. SECCIÓN DE LLAMADAS ENTRANTES */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-5 ${cardCls}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Llamadas entrantes</h3>
                    <p className={`text-[11px] ${mutedTextCls}`}>Vibración, encendido de pantalla y tono</p>
                  </div>
                </div>
              </div>

              {/* Toggles: Vibrar y Prender Celular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                    isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold">Vibración de llamada</span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Activa
                    </span>
                  </div>
                  <p className={`text-[11px] ${mutedTextCls}`}>
                    Mantiene vibración activa en llamadas entrantes para que no pierdas ninguna.
                  </p>
                  <button
                    onClick={handleTestCallVibration}
                    disabled={isTestingCallVibration}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isNightMode
                        ? 'bg-white/5 hover:bg-white/10 text-emerald-400 border-white/10'
                        : 'bg-white hover:bg-slate-100 text-emerald-600 border-slate-200'
                    }`}
                  >
                    <Vibrate className="w-3 h-3" />
                    <span>{isTestingCallVibration ? 'Vibrando...' : 'Probar vibración'}</span>
                  </button>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                    isNightMode ? 'bg-[#0f131c] border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold">Encender pantalla</span>
                    </div>
                    <span className="text-[11px] font-medium text-amber-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Activo
                    </span>
                  </div>
                  <p className={`text-[11px] ${mutedTextCls}`}>
                    Despierta la pantalla automáticamente cuando entra una llamada.
                  </p>
                  <button
                    onClick={handleTestScreenWake}
                    disabled={isTestingWakeScreen}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isNightMode
                        ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                        : 'bg-white hover:bg-slate-100 text-amber-600 border-slate-200'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>{isTestingWakeScreen ? 'Probando...' : 'Probar pantalla'}</span>
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
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir audio</span>
                  </button>
                </div>

                {/* Custom Audio Banner if active */}
                {user.callRingtoneId === 'custom' && user.customCallRingtoneUrl && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {user.customCallRingtoneName || 'Audio personalizado'}
                        </span>
                        <span className="text-[10px] text-emerald-300">Tono de llamada activo</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePreview('call', 'custom', user.customCallRingtoneUrl)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                      >
                        {playingPreviewId === 'call_custom' ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => callAudioInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-colors cursor-pointer"
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
                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 text-white'
                            : 'bg-[#181d28] border-white/5 text-[#8d90a0] hover:text-white hover:border-white/15'
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
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isPlaying
                                ? 'bg-emerald-600 text-white border-emerald-400'
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
            <section className="rounded-2xl bg-[#141822] border border-white/10 p-5 flex flex-col gap-5 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Mensajes y notificaciones</h3>
                    <p className="text-[11px] text-[#8d90a0]">Vibración, pantalla y tono de alerta</p>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Vibrar con mensajes</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ vibrateOnMessage: user.vibrateOnMessage === false ? true : false })}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.vibrateOnMessage !== false ? 'bg-[#0284c7]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.vibrateOnMessage !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8d90a0]">
                    Vibra brevemente al recibir un mensaje nuevo.
                  </p>
                  <button
                    onClick={handleTestMsgVibration}
                    disabled={isTestingMsgVibration}
                    className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-blue-300 border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Vibrate className="w-3 h-3" />
                    <span>{isTestingMsgVibration ? 'Vibrando...' : 'Probar vibración'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#1a202c] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white">Encender pantalla</span>
                    </div>
                    <button
                      onClick={() => onUpdateUser({ wakeScreenOnMessage: user.wakeScreenOnMessage === false ? true : false })}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        user.wakeScreenOnMessage !== false ? 'bg-[#0284c7]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          user.wakeScreenOnMessage !== false ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8d90a0]">
                    Activa la pantalla cuando llega un mensaje importante.
                  </p>
                  <button
                    onClick={handleTestScreenWake}
                    disabled={isTestingWakeScreen}
                    className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-sky-300 border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Probar encendido</span>
                  </button>
                </div>
              </div>

              {/* Selector de Tono de Mensajes */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span>Tono de mensaje:</span>
                  </span>
                  <button
                    onClick={() => messageAudioInputRef.current?.click()}
                    className="py-1.5 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir audio</span>
                  </button>
                </div>

                {user.messageToneId === 'custom' && user.customMessageToneUrl && (
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-400/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {user.customMessageToneName || 'Audio personalizado'}
                        </span>
                        <span className="text-[10px] text-blue-300">Tono de mensaje activo</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePreview('message', 'custom', user.customMessageToneUrl)}
                        className="p-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white transition-colors cursor-pointer"
                      >
                        {playingPreviewId === 'message_custom' ? (
                          <Square className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => messageAudioInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition-colors cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MESSAGE_TONE_OPTIONS.map((opt) => {
                    const isSelected =
                      (user.messageToneId || 'system_default') === opt.id;
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
                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-[#181d28] border-white/5 text-[#8d90a0] hover:text-white hover:border-white/15'
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
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isPlaying
                                ? 'bg-[#0284c7] text-white border-blue-400'
                                : 'bg-white/5 hover:bg-white/10 text-blue-400 border-white/10'
                            }`}
                          >
                            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold">
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
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Status Selector */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-3 ${cardCls}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-white/10">
                <Activity className="w-3.5 h-3.5" />
                <span>Disponibilidad</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'online', label: 'En línea' },
                  { id: 'busy', label: 'Ocupado' },
                  { id: 'offline', label: 'Desconectado' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdateUser({ status: s.id as any })}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      user.status === s.id
                        ? 'bg-[#0284c7] border-[#0284c7] text-white'
                        : isNightMode
                        ? 'bg-[#0f131c] border-white/10 text-slate-300 hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Selector de Tema Festivo Mensual */}
            <section className={`rounded-2xl border p-5 flex flex-col gap-3 ${cardCls}`}>
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Tema de temporada</h4>
                  <span className={`text-[11px] ${mutedTextCls}`}>Ambientación opcional según la época</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => onUpdateUser({ monthlyTheme: 'auto' })}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    !user.monthlyTheme || user.monthlyTheme === 'auto'
                      ? 'bg-[#0284c7] border-[#0284c7] text-white'
                      : isNightMode
                      ? 'bg-[#0f131c] border-white/10 text-slate-300 hover:text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>📅</span>
                    <span>Automático</span>
                  </div>
                  <span className="text-[10px] opacity-80 mt-0.5 block">Calendario actual</span>
                </button>

                {MONTHLY_THEMES.map((theme) => {
                  const isSelected = user.monthlyTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateUser({ monthlyTheme: theme.id })}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : isNightMode
                          ? 'bg-[#0f131c] border-white/10 text-slate-300 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center gap-1.5 truncate">
                        <span>{theme.icon}</span>
                        <span className="truncate">{theme.name}</span>
                      </div>
                      <span className="text-[10px] opacity-80 mt-0.5 block truncate">{theme.festivityName}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* App Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  if (onToggleClassicMode) {
                    onToggleClassicMode();
                  } else {
                    localStorage.setItem('pidge_classic_mode', 'true');
                    window.location.reload();
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#161b24] hover:bg-[#1e2430] border-white/10 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span>{isClassicMode ? 'Usar vista completa' : 'Cambiar a modo clásico'}</span>
              </button>

              <button
                onClick={() => onOpenTutorial?.()}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#161b24] hover:bg-[#1e2430] border-white/10 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Ver guía rápida</span>
              </button>

              <button
                onClick={() => onOpenTour?.()}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-[#161b24] hover:bg-[#1e2430] border-white/10 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <Compass className="w-4 h-4 text-[#0284c7]" />
                <span>Recorrido por las funciones</span>
              </button>

              {onOpenInstallModal && (
                <button
                  onClick={onOpenInstallModal}
                  className="w-full py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Instalar en celular o tablet</span>
                </button>
              )}
            </div>

            {onSignOut && (
              <section
                className={`rounded-2xl border p-4 flex items-center justify-between mt-1 ${
                  isNightMode
                    ? 'bg-[#161b24] border-white/10'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold">Cerrar sesión</span>
                  <span className={`text-[11px] ${mutedTextCls}`}>
                    Vuelve a la pantalla de Iniciar sesión o Registrarse
                  </span>
                </div>
                <button
                  onClick={() => onSignOut()}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                    isNightMode
                      ? 'bg-white/10 hover:bg-white/15 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </section>
            )}

            {/* Danger Zone: Delete Account */}
            <section className="rounded-2xl bg-red-500/10 border border-red-500/25 p-4 flex items-center justify-between mt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-red-500">Eliminar cuenta</span>
                <span className={`text-[11px] ${mutedTextCls}`}>Borra todos tus datos y perfil</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
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

      {/* Avatar Capture Modal (Gallery & Live Camera) */}
      <AvatarCaptureModal
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={(newAvatar) => {
          setAvatarUrl(newAvatar);
          onUpdateUser({ avatarUrl: newAvatar });
          setSavedFeedback(true);
          setTimeout(() => setSavedFeedback(false), 2500);
        }}
      />

      {/* Digital AI Avatar Studio */}
      <DigitalAvatarStudioModal
        isOpen={showAvatarStudio}
        onClose={() => setShowAvatarStudio(false)}
        user={user}
        isNightMode={isNightMode}
        onSaveAvatarConfig={(cfg) => {
          onUpdateUser({ digitalAvatar: cfg });
          setSavedFeedback(true);
          setTimeout(() => setSavedFeedback(false), 2500);
        }}
      />

      {/* AI Sticker Factory */}
      <AiStickerFactoryModal
        isOpen={showStickerFactory}
        onClose={() => setShowStickerFactory(false)}
        customPacks={user.customStickerPacks || []}
        onSavePacks={(packs) => {
          onUpdateUser({ customStickerPacks: packs });
          setSavedFeedback(true);
          setTimeout(() => setSavedFeedback(false), 2500);
        }}
        isNightMode={isNightMode}
      />

      {/* Profile Photoshop Background Editor Modal */}
      <ProfilePhotoshopEditorModal
        isOpen={showPhotoshopEditor}
        onClose={() => setShowPhotoshopEditor(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={(newAvatar) => {
          setAvatarUrl(newAvatar);
          onUpdateUser({ avatarUrl: newAvatar });
          setSavedFeedback(true);
          setTimeout(() => setSavedFeedback(false), 2500);
        }}
        isNightMode={isNightMode}
      />
    </div>
  );
};
