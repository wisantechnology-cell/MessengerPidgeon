import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Shield,
  LogOut,
  Check,
  Phone,
  Mail,
  Edit3,
  Lock,
  LogIn,
  Users,
  Trash2,
  AlertTriangle,
  Activity,
  QrCode,
  Sparkles,
  Compass,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { UserProfile, Wallpaper } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { DEFAULT_PIDGEON_AVATAR, PRESET_AVATARS, createSvgAvatar } from '../utils/avatarUtils';
import { isPhoneTakenByAnotherUser } from '../utils/phoneValidation';
import { PidgeXFullLogo } from './BirdLogo';
import { ProfileQrCardModal } from './ProfileQrCardModal';

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
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({
  user,
  wallpapers,
  firebaseUser,
  isCloudSynced,
  isNightMode = false,
  isClassicMode = false,
  onGoogleLogin,
  onGoogleLogout,
  onUpdateUser,
  onToggleDoNotDisturb,
  onApproveFriendRequest,
  onRejectFriendRequest,
  onDeleteAccount,
  onAddScannedContact,
  onToggleClassicMode,
  onOpenTutorial,
  onOpenTour,
  onOpenInstallModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [name, setName] = useState<string>(user.name || 'USUARIO NUEVO');
  const [bio, setBio] = useState<string>(user.bio || 'Soy nuevo en PidgeX');
  const [username, setUsername] = useState<string>(user.username || '@usuarionuevo');
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || DEFAULT_PIDGEON_AVATAR);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showQrCardModal, setShowQrCardModal] = useState<boolean>(false);

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

  return (
    <div className={`flex flex-col w-full h-full min-h-screen ${isNightMode ? 'bg-[#0f131c] text-[#dfe2ee]' : 'bg-[#e0f2fe] text-[#0c2340]'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 h-16 flex items-center justify-between ${
        isNightMode ? 'bg-[#0f131c]/90 border-white/5' : 'bg-white/90 border-sky-200/80'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-[#38bdf8] flex items-center justify-center text-white shadow-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Ajustes & Perfil</h1>
            <span className="text-[11px] text-[#8d90a0]">Panel simplificado PidgeX</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'account' ? 'bg-blue-600 text-white shadow' : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            Cuenta & Nube
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[600px] w-full mx-auto px-4 py-6 pb-28 flex flex-col gap-6 overflow-y-auto">
        <PidgeXFullLogo />

        {activeTab === 'profile' ? (
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
          </div>
        ) : (
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
            <div className="mt-4 mb-2">
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
            <div className="mt-2 mb-2">
              <button
                onClick={() => onOpenTutorial?.()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ver Tutorial Interactivo de PidgeX</span>
              </button>
            </div>

            {/* Guía Interactiva en Pantalla (Tour con Flechitas) */}
            <div className="mt-2 mb-2">
              <button
                onClick={() => onOpenTour?.()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Iniciar Guía Interactiva con Flechitas</span>
              </button>
            </div>

            {/* Instalar PidgeX en Celular y Tablet */}
            {onOpenInstallModal && (
              <div className="mt-2 mb-2">
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
            <section className="rounded-3xl bg-red-950/20 border border-red-500/30 p-5 shadow-xl flex items-center justify-between">
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
