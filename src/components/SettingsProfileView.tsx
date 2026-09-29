import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Upload,
  Link as LinkIcon,
  Shield,
  BellOff,
  Bell,
  LogOut,
  Check,
  Sparkles,
  Phone,
  Mail,
  Edit3,
  Lock,
  UserCheck,
  LogIn,
  Users,
  Trash2,
  AlertTriangle,
  Wallpaper as WallpaperIcon,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { UserProfile, Wallpaper } from '../types';
import { ensurePhoneStartsWith16 } from '../utils/phoneUtils';
import { PRESET_AVATARS, createSvgAvatar, DEFAULT_PIDGEON_AVATAR } from '../utils/avatarUtils';
import { isPhoneTakenByAnotherUser } from '../utils/phoneValidation';

interface SettingsProfileViewProps {
  user: UserProfile;
  wallpapers: Wallpaper[];
  firebaseUser?: any;
  isCloudSynced?: boolean;
  isNightMode?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onToggleDoNotDisturb?: (duration?: string) => void;
  onApproveFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
  onDeleteAccount?: () => Promise<void> | void;
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({
  user,
  wallpapers,
  firebaseUser,
  isCloudSynced,
  isNightMode = false,
  onGoogleLogin,
  onGoogleLogout,
  onUpdateUser,
  onToggleDoNotDisturb,
  onApproveFriendRequest,
  onRejectFriendRequest,
  onDeleteAccount,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(user.name || 'USUARIO NUEVO');
  const [bio, setBio] = useState<string>(user.bio || 'Soy nuevo en MessengerPidgeon');
  const [username, setUsername] = useState<string>(user.username || '@usuarionuevo');
  const [phone, setPhone] = useState<string>(user.phone);
  const [email, setEmail] = useState<string>(user.email);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || DEFAULT_PIDGEON_AVATAR);
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState<boolean>(false);

  // Wallpaper settings state inside Ajustes
  const [wallpaperFeedback, setWallpaperFeedback] = useState<boolean>(false);
  const [customWpUrlInput, setCustomWpUrlInput] = useState<string>('');
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name || 'USUARIO NUEVO');
    setBio(user.bio || 'Soy nuevo en MessengerPidgeon');
    setUsername(user.username || '@usuarionuevo');
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || DEFAULT_PIDGEON_AVATAR);
  }, [user]);

  const handleSaveProfile = async () => {
    setPhoneError(null);
    const finalName = name.trim() ? name.trim() : 'USUARIO NUEVO';
    const finalBio = bio.trim() ? bio.trim() : 'Soy nuevo en MessengerPidgeon';
    const finalUsername = username.trim() ? username.trim() : '@usuarionuevo';
    const sanitizedPhone = ensurePhoneStartsWith16(phone);

    // Check if phone number already exists for another user
    setIsCheckingPhone(true);
    const isTaken = await isPhoneTakenByAnotherUser(sanitizedPhone, user.id);
    setIsCheckingPhone(false);

    if (isTaken) {
      setPhoneError('Este número de teléfono ya existe');
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
      email,
      avatarUrl: avatarUrl || DEFAULT_PIDGEON_AVATAR,
    });

    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newUrl = event.target.result as string;
          setAvatarUrl(newUrl);
          onUpdateUser({ avatarUrl: newUrl });
          setShowAvatarPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectWp = (wpId: string, customUrl?: string) => {
    onUpdateUser({
      wallpaperId: wpId,
      customWallpaperUrl: wpId === 'custom' ? (customUrl || user.customWallpaperUrl || '') : '',
    });
    setWallpaperFeedback(true);
    setTimeout(() => setWallpaperFeedback(false), 2200);
  };

  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newUrl = event.target.result as string;
          handleSelectWp('custom', newUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeWallpaper =
    wallpapers.find((w) => w.id === user.wallpaperId) || wallpapers[0];
  const activeWallpaperPreview =
    user.wallpaperId === 'custom' && user.customWallpaperUrl
      ? user.customWallpaperUrl
      : activeWallpaper?.previewUrl || activeWallpaper?.url;
  const activeWallpaperTitle =
    user.wallpaperId === 'custom'
      ? 'Fondo Personalizado'
      : activeWallpaper?.name || 'Fondo predeterminado';

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-transparent text-[#dfe2ee]">
      {/* Header */}
      <header className="sticky top-0 w-full z-40 bg-[#0a0e16]/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#2563eb]/20 flex items-center justify-center text-[#7bd0ff]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#dfe2ee]">Mi Perfil & Ajustes</h1>
            <p className="text-[11px] text-[#8d90a0]">Personalización de cuenta MessengerPidgeon</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-xs text-[#7bd0ff] font-semibold flex items-center gap-1 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Cuenta</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-4 pb-28 flex flex-col gap-5 overflow-y-auto">
        {/* Profile Card Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c2028] via-[#262a33] to-[#181c24] p-5 border border-white/10 shadow-xl flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <img
              src={avatarUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#2563eb]/40 shadow-2xl"
            />
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white">{name}</h2>
          <span className="text-xs text-[#7bd0ff] font-mono mt-0.5">{username}</span>
          <p className="text-xs text-[#c3c6d7] mt-2 max-w-sm leading-relaxed italic">
            "{bio}"
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.status === 'online' ? 'En línea' : 'Modo Enfoque'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Bird Verified</span>
            </span>
          </div>
        </section>

        {/* Firebase Cloud Sync Section */}
        <section className="bg-gradient-to-br from-[#122033] via-[#151c28] to-[#0d1420] rounded-2xl p-4 border border-cyan-500/30 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-[#2563eb] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Firebase Cloud Sync</span>
                <span className="text-[10px] text-cyan-300">
                  {firebaseUser ? '🟢 Sincronizado en la nube (Firestore)' : '⚪ Guardado local (Inicia sesión con Google)'}
                </span>
              </div>
            </div>
            {firebaseUser ? (
              <button
                onClick={onGoogleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-[#2563eb] hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Conectar Google</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            Firebase almacena de forma segura tus <strong className="text-cyan-300">conversaciones, conocidos, compras del Marketplace, puntajes de juegos, cuenta, fondos de pantalla, modo no molestar, información y fotos</strong> para acceder desde cualquier dispositivo.
          </p>
        </section>

        {/* Edit Info Form */}
        <section className="bg-[#1c2028] rounded-2xl p-4 border border-white/5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-[#dfe2ee] uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-[#7bd0ff]" />
              <span>Editar Información de Perfil</span>
            </span>
            {savedFeedback && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
          </div>

          {/* Name Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8d90a0] font-semibold">Nombre para mostrar</label>
            <input
              type="text"
              value={name}
              placeholder="USUARIO NUEVO"
              onChange={(e) => setName(e.target.value)}
              className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Bio Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8d90a0] font-semibold">Descripción / Estado</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Soy nuevo en MessengerPidgeon"
              className="bg-[#181c24] text-sm text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Username Field */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#8d90a0] font-semibold">Usuario</label>
              <input
                type="text"
                value={username}
                placeholder="@usuarionuevo"
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#181c24] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#8d90a0] font-semibold">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null);
                }}
                className={`bg-[#181c24] text-xs text-[#dfe2ee] px-3 py-2 rounded-xl border focus:outline-none ${
                  phoneError ? 'border-red-500/80 ring-1 ring-red-500/40' : 'border-white/10 focus:border-[#2563eb]'
                }`}
              />
              {phoneError && (
                <span className="text-[11px] font-bold text-red-400 mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{phoneError}</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#00a6e0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </section>

        {/* Control Parental & Seguridad */}
        <section className="bg-gradient-to-br from-[#201828] via-[#1a1c26] to-[#121620] rounded-2xl p-4 border border-purple-500/30 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Control Parental & Seguridad</span>
                <span className="text-[10px] text-purple-300">Protección de mensajes y aprobación de amistades</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateUser({ parentalControlEnabled: !user.parentalControlEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                user.parentalControlEnabled ? 'bg-purple-600' : 'bg-[#2b303c]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  user.parentalControlEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {user.parentalControlEnabled && (
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#8d90a0] font-semibold">Nombre Padre/Madre</label>
                  <input
                    type="text"
                    defaultValue={user.parentName || 'Mamá / Papá'}
                    onBlur={(e) => onUpdateUser({ parentName: e.target.value })}
                    className="bg-[#181c24] text-xs text-[#dfe2ee] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#8d90a0] font-semibold">Teléfono / Alerta</label>
                  <input
                    type="text"
                    defaultValue={user.parentPhone || '16 600 000 000'}
                    onBlur={(e) => onUpdateUser({ parentPhone: ensurePhoneStartsWith16(e.target.value) })}
                    className="bg-[#181c24] text-xs text-[#dfe2ee] px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-purple-200 bg-purple-950/40 p-3 rounded-xl border border-purple-500/20 leading-relaxed">
                🛡️ <strong className="text-white">Activo:</strong> Si se detecta alguna grosería o palabra inadecuada en los chats, se enviará un aviso automático a <span className="text-purple-300 font-bold">{user.parentName || 'tus padres'}</span>. Además, cualquier solicitud para agregar nuevos amigos requiere tu aprobación aquí abajo.
              </div>

              {/* Pending Friend Requests */}
              <div className="flex flex-col gap-2 pt-2 border-t border-purple-500/20">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Solicitudes de Amistad Pendientes ({user.pendingFriendRequests?.length || 0})</span>
                </span>

                {(!user.pendingFriendRequests || user.pendingFriendRequests.length === 0) ? (
                  <p className="text-[11px] text-[#8d90a0] italic">No hay solicitudes de amistad pendientes de aprobación.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {user.pendingFriendRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between bg-[#151922] p-2.5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <img src={req.avatarUrl} alt={req.name} className="w-9 h-9 rounded-full object-cover" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{req.name}</span>
                            <span className="text-[10px] text-[#8d90a0]">{req.username || req.phone || 'Solicitud de contacto'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onApproveFriendRequest && onApproveFriendRequest(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/30 cursor-pointer"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => onRejectFriendRequest && onRejectFriendRequest(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold border border-red-500/30 cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Modo IA & Asistente Switch Section */}
        <section className="bg-[#1c2028] rounded-2xl p-4 border border-white/5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  user.aiModeEnabled
                    ? 'bg-[#943fe2]/20 text-[#ddb7ff]'
                    : 'bg-[#262a33] text-[#8d90a0]'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#dfe2ee]">Modo IA General</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      user.aiModeEnabled
                        ? 'bg-[#943fe2]/25 text-[#ddb7ff]'
                        : 'bg-white/10 text-[#8d90a0]'
                    }`}
                  >
                    {user.aiModeEnabled ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
                <span className="text-[11px] text-[#8d90a0] max-w-[260px]">
                  {user.aiModeEnabled
                    ? 'Muestra respuestas inteligentes contextuales y activa Copilot en chats.'
                    : 'Sugerencias predictivas desactivadas. No se mostrarán tarjetas IA.'}
                </span>
              </div>
            </div>

            <label
              aria-label="Alternar Modo IA en Ajustes"
              className="relative inline-flex items-center cursor-pointer shrink-0 ml-2"
            >
              <input
                type="checkbox"
                checked={user.aiModeEnabled}
                onChange={() => onUpdateUser({ aiModeEnabled: !user.aiModeEnabled })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#31353e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-[#943fe2] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm" />
            </label>
          </div>

          {/* Sub-setting: Respuestas automáticas con IA en todas las conversaciones */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#dfe2ee]">
                Auto-Respuesta en todas las conversaciones
              </span>
              <span className="text-[11px] text-[#8d90a0] max-w-[260px]">
                La IA responderá de forma personalizada e instantánea con la personalidad única de cada contacto.
              </span>
            </div>

            <label
              aria-label="Alternar Auto-Respuesta IA en conversaciones"
              className="relative inline-flex items-center cursor-pointer shrink-0 ml-2"
            >
              <input
                type="checkbox"
                disabled={!user.aiModeEnabled}
                checked={user.aiModeEnabled && user.autoReplyWithAi !== false}
                onChange={() =>
                  onUpdateUser({ autoReplyWithAi: !(user.autoReplyWithAi !== false) })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#31353e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-[#2563eb] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm peer-disabled:opacity-40" />
            </label>
          </div>
        </section>

        {/* Modo No Molestar Section */}
        <section className="bg-[#1c2028] rounded-2xl p-4 border border-white/5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  user.doNotDisturb
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#262a33] text-[#8d90a0]'
                }`}
              >
                {user.doNotDisturb ? (
                  <BellOff className="w-5 h-5 text-amber-400" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#dfe2ee]">Modo No Molestar</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      user.doNotDisturb
                        ? 'bg-amber-500/25 text-amber-300'
                        : 'bg-white/10 text-[#8d90a0]'
                    }`}
                  >
                    {user.doNotDisturb ? 'Silenciado' : 'Inactivo'}
                  </span>
                </div>
                <span className="text-[11px] text-[#8d90a0] max-w-[260px]">
                  Silencia notificaciones, llamadas y sonidos de alerta para que nadie te interrumpa.
                </span>
              </div>
            </div>

            <label
              aria-label="Alternar Modo No Molestar en Ajustes"
              className="relative inline-flex items-center cursor-pointer shrink-0 ml-2"
            >
              <input
                type="checkbox"
                checked={user.doNotDisturb}
                onChange={() => {
                  if (onToggleDoNotDisturb) {
                    onToggleDoNotDisturb();
                  } else {
                    onUpdateUser({ doNotDisturb: !user.doNotDisturb });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#31353e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm" />
            </label>
          </div>

          {user.doNotDisturb && (
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-semibold text-[#8d90a0]">
                Duración del silencio:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1h', label: '1 hora' },
                  { id: '8h', label: '8 horas' },
                  { id: 'always', label: 'Indefinido' },
                ].map((dur) => (
                  <button
                    key={dur.id}
                    onClick={() => onUpdateUser({ dndDuration: dur.id })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      (user.dndDuration || 'always') === dur.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-[#262a33] text-[#8d90a0] border-white/5 hover:text-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Fondos de Pantalla Section inside Ajustes */}
        <section className="bg-[#1c2028] rounded-2xl p-4 border border-white/10 flex flex-col gap-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00a6e0]/20 border border-[#00a6e0]/30 flex items-center justify-center text-[#7bd0ff]">
                <WallpaperIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#dfe2ee] block">Fondos de Pantalla</span>
                <span className="text-[11px] text-[#8d90a0]">Se aplican en tus chats y en toda la app</span>
              </div>
            </div>
            {wallpaperFeedback ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>¡Aplicado!</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#7bd0ff] bg-[#00a6e0]/10 px-2.5 py-1 rounded-full border border-[#00a6e0]/20 truncate max-w-[140px]">
                {activeWallpaperTitle}
              </span>
            )}
          </div>

          {/* Wallpaper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Custom wallpaper item if defined */}
            {user.customWallpaperUrl && (
              <div
                onClick={() => handleSelectWp('custom', user.customWallpaperUrl)}
                className={`relative h-24 rounded-xl overflow-hidden shadow-sm cursor-pointer group active:scale-95 transition-all border ${
                  user.wallpaperId === 'custom'
                    ? 'border-[#00a6e0] ring-2 ring-[#00a6e0]/50'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={user.customWallpaperUrl}
                  alt="Fondo Personalizado"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white truncate">Mi Foto</span>
                </div>
                {user.wallpaperId === 'custom' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00a6e0] flex items-center justify-center text-white shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            )}

            {/* Preset wallpapers */}
            {wallpapers.map((wp) => {
              const isSelected = user.wallpaperId === wp.id;
              return (
                <div
                  key={wp.id}
                  onClick={() => handleSelectWp(wp.id)}
                  className={`relative h-24 rounded-xl overflow-hidden shadow-sm cursor-pointer group active:scale-95 transition-all border ${
                    isSelected
                      ? 'border-[#00a6e0] ring-2 ring-[#00a6e0]/50'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={wp.previewUrl || wp.url}
                    alt={wp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                      {wp.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00a6e0] flex items-center justify-center text-white shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload and URL actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-white/5">
            <button
              onClick={() => wallpaperFileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-[#262a33] hover:bg-[#323742] text-xs font-semibold text-[#dfe2ee] hover:text-white border border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>Subir Foto</span>
            </button>
            <input
              ref={wallpaperFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleWallpaperFileUpload}
            />

            <button
              onClick={() => setIsCustomUrlOpen(!isCustomUrlOpen)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#262a33] hover:bg-[#323742] text-xs font-semibold text-[#dfe2ee] hover:text-white border border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#7bd0ff]" />
              <span>{isCustomUrlOpen ? 'Ocultar Enlace' : 'Pegar Enlace URL'}</span>
            </button>
          </div>

          {isCustomUrlOpen && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                placeholder="https://ejemplo.com/mi-imagen.jpg"
                value={customWpUrlInput}
                onChange={(e) => setCustomWpUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0f131c] border border-white/10 text-xs text-white placeholder-[#8d90a0]/60 focus:outline-none focus:border-[#00a6e0]"
              />
              <button
                onClick={() => {
                  if (customWpUrlInput.trim()) {
                    handleSelectWp('custom', customWpUrlInput.trim());
                    setCustomWpUrlInput('');
                    setIsCustomUrlOpen(false);
                  }
                }}
                disabled={!customWpUrlInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#00a6e0] hover:bg-[#0284c7] disabled:opacity-40 disabled:hover:bg-[#00a6e0] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}
        </section>

        {/* Security & Cifrado info */}
        <section className="bg-[#181c24] rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Lock className="w-4 h-4" />
            <span>Cifrado Extremo a Extremo de MessengerPidgeon</span>
          </div>
          <p className="text-[11px] text-[#8d90a0] leading-relaxed">
            Todos tus chats, notas de voz, fotos y videos viajan con encriptación punto a punto y
            protocolos seguros MessengerPidgeon Secure. Nadie externo tiene acceso a tus conversaciones.
          </p>
        </section>

        {/* Zona Peligrosa - Borrar Cuenta */}
        <section className="bg-gradient-to-br from-red-950/40 via-[#1e1418] to-[#161216] rounded-2xl p-4 border border-red-500/30 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Zona de Peligro</span>
                <span className="text-[10px] text-red-300">Eliminación definitiva de cuenta y datos</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#c9a6a6] leading-relaxed">
            Si decides borrar tu cuenta, se eliminarán tus datos de perfil, tus mensajes, chats, amigos agregados y productos del marketplace. Esta acción es permanente y no se puede deshacer.
          </p>

          <button
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600/25 hover:bg-red-600/35 border border-red-500/40 text-red-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Borrar mi cuenta definitivamente</span>
          </button>
        </section>
      </main>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-md p-4 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-sm text-[#dfe2ee]">Seleccionar Avatar de Perfil</span>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="w-7 h-7 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Presets de Avatares Vectoriales Limpios */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#8d90a0]">Elige un avatar vectorial estilizado:</span>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(av.url);
                      onUpdateUser({ avatarUrl: av.url });
                      setShowAvatarPicker(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#262a33] hover:bg-[#31353e] border border-white/5 hover:border-[#2563eb]/50 transition-all cursor-pointer group"
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-12 h-12 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] text-[#c3c6d7] text-center font-medium line-clamp-1">{av.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload file */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-[#8d90a0]">O sube tu propia foto desde tu dispositivo:</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-xs text-[#dfe2ee] font-medium flex items-center justify-center gap-2 border border-dashed border-white/20 transition-colors"
              >
                <Upload className="w-4 h-4 text-[#7bd0ff]" />
                <span>Elegir archivo desde el dispositivo</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* URL input */}
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                placeholder="O pega un enlace de imagen..."
                value={customAvatarInput}
                onChange={(e) => setCustomAvatarInput(e.target.value)}
                className="flex-1 bg-[#181c24] text-xs text-[#dfe2ee] placeholder:text-[#8d90a0] px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (customAvatarInput.trim()) {
                    setAvatarUrl(customAvatarInput.trim());
                    onUpdateUser({ avatarUrl: customAvatarInput.trim() });
                    setShowAvatarPicker(false);
                  }
                }}
                className="px-3 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-xl"
              >
                Usar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login / Cambiar Cuenta Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c2028] border border-white/10 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#7bd0ff]" />
                <span className="font-bold text-sm text-[#dfe2ee]">Iniciar Sesión / Cambiar Cuenta</span>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-7 h-7 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8d90a0]">
              Puedes restablecer tu perfil a "USUARIO NUEVO" o iniciar sesión con una cuenta limpia:
            </p>

            {/* Profile Options */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const avatar = DEFAULT_PIDGEON_AVATAR;
                  onUpdateUser({
                    name: 'USUARIO NUEVO',
                    username: '@usuarionuevo',
                    bio: 'Soy nuevo en MessengerPidgeon',
                    avatarUrl: avatar,
                  });
                  setName('USUARIO NUEVO');
                  setUsername('@usuarionuevo');
                  setBio('Soy nuevo en MessengerPidgeon');
                  setAvatarUrl(avatar);
                  setShowLoginModal(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-left border border-white/5 transition-colors cursor-pointer"
              >
                <img src={DEFAULT_PIDGEON_AVATAR} alt="Usuario Nuevo" className="w-10 h-10 rounded-full object-cover bg-blue-600/20" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#dfe2ee]">USUARIO NUEVO</span>
                  <span className="text-[11px] text-[#7bd0ff]">@usuarionuevo</span>
                  <span className="text-[10px] text-[#8d90a0] mt-0.5">"Soy nuevo en MessengerPidgeon"</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Borrado de Cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1215] border border-red-500/30 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white">¿Borrar tu cuenta?</span>
                  <span className="text-[10px] text-red-300 block">Esta acción eliminará todos tus datos</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="w-7 h-7 rounded-full bg-[#262a33] text-[#8d90a0] hover:text-white flex items-center justify-center disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-xs text-red-200 leading-relaxed flex flex-col gap-2">
              <p>
                ⚠️ <strong>Advertencia irreversible:</strong> Se eliminarán permanentemente:
              </p>
              <ul className="list-disc list-inside text-[11px] text-red-300 space-y-1 pl-1">
                <li>Tu perfil (<strong>{name}</strong> - <code>{username}</code>)</li>
                <li>Todos tus mensajes y conversaciones</li>
                <li>Tus contactos y solicitudes de amistad</li>
                <li>Tus productos publicados en el Marketplace</li>
                <li>Tu información sincronizada en la nube</li>
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#c9a6a6] font-medium">
                Escribe <span className="text-red-400 font-bold select-all">BORRAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="BORRAR"
                disabled={isDeleting}
                className="bg-[#120e10] text-sm text-white px-3 py-2 rounded-xl border border-red-500/30 focus:outline-none focus:border-red-500 uppercase tracking-widest"
              />
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-xs text-[#dfe2ee] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'BORRAR' || isDeleting}
                onClick={async () => {
                  if (onDeleteAccount) {
                    try {
                      setIsDeleting(true);
                      setDeleteError(null);
                      await onDeleteAccount();
                      setShowDeleteModal(false);
                    } catch (err: any) {
                      setDeleteError(err?.message || 'Error al eliminar la cuenta. Inténtalo de nuevo.');
                      setIsDeleting(false);
                    }
                  } else {
                    setShowDeleteModal(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Borrando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
