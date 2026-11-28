import React, { useEffect, useState } from 'react';
import { Bell, BellRing, CheckCircle2, Download, X } from 'lucide-react';
import { UserProfile } from '../types';
import {
  getPushSubscriptionStatus,
  isIosBrowser,
  isStandalonePwa,
  registerPushSubscription,
} from '../utils/pushManager';
import { sendNativeMessageNotification } from '../utils/nativeNotifications';

interface NotificationPermissionBannerProps {
  isNightMode?: boolean;
  user?: UserProfile;
  onOpenInstallModal?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  isNightMode = false,
  user,
  onOpenInstallModal,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('pidgex_notif_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );
  const [needsServerSync, setNeedsServerSync] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [justActivated, setJustActivated] = useState<boolean>(false);
  const [needsIosInstall, setNeedsIosInstall] = useState<boolean>(false);

  useEffect(() => {
    const iosNeedsPwa = isIosBrowser() && !isStandalonePwa();
    setNeedsIosInstall(iosNeedsPwa);

    let cancelled = false;
    const checkStatus = async () => {
      const status = await getPushSubscriptionStatus(user?.phone, user?.id);
      if (cancelled) return;
      setPermission(status.permission);
      setNeedsServerSync(status.permission === 'granted' && (!status.hasBrowserSub || !status.serverSubscribed));
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [user?.phone, user?.id]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('pidgex_notif_banner_dismissed', '1');
    } catch {}
  };

  const handleActivate = async () => {
    if (isActivating) return;
    setIsActivating(true);
    try {
      const result = await registerPushSubscription(user?.phone, user?.id, true);
      setPermission(result.permission);

      if (result.permission === 'granted') {
        setNeedsServerSync(false);
        setJustActivated(true);
        // Vibrate & play phone's own OS sound to confirm immediately
        await sendNativeMessageNotification(
          'PidgeX',
          'Notificaciones y llamadas con pantalla apagada activadas.',
          undefined,
          'notif_activated',
          user
        );
        setTimeout(() => {
          setJustActivated(false);
        }, 3500);
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (dismissed) return null;

  if (justActivated) {
    return (
      <div
        className={`mx-3 mt-2.5 mb-1 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 ${
          isNightMode
            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs font-medium truncate">
            Notificaciones activas: recibirás llamadas y mensajes aunque cierres la app.
          </p>
        </div>
      </div>
    );
  }

  // On iOS Safari, Web Push only works once added to Home Screen
  if (needsIosInstall && permission !== 'granted') {
    return (
      <div
        className={`mx-3 mt-2.5 mb-1 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
          isNightMode
            ? 'bg-[#121926] border-sky-500/25 text-slate-100'
            : 'bg-sky-50 border-sky-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0284c7]/15 text-[#0284c7] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">Instala PidgeX para recibir llamadas</p>
            <p className={`text-[11px] truncate ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
              En iPhone, agrégalo a Inicio para vibración y alertas en segundo plano.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso"
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isNightMode ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200/70'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Already granted and synced with backend -> hide banner completely
  if (permission === 'unsupported' || (permission === 'granted' && !needsServerSync)) {
    return null;
  }

  return (
    <div
      className={`mx-3 mt-2.5 mb-1 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
        isNightMode
          ? 'bg-[#121926] border-sky-500/25 text-slate-100'
          : 'bg-sky-50/90 border-sky-200 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#0284c7]/15 text-[#0284c7] flex items-center justify-center shrink-0">
          {permission === 'denied' ? <Bell className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">
            {permission === 'denied'
              ? 'Notificaciones bloqueadas en este navegador'
              : needsServerSync
              ? 'Conectar llamadas en segundo plano'
              : 'Activa notificaciones y llamadas en vivo'}
          </p>
          <p className={`text-[11px] truncate ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {permission === 'denied'
              ? 'Habilítalas en el candado de la barra para recibir llamadas y sonidos.'
              : 'Pantalla encendida, vibración y sonido de tu celular aunque cierres la app.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {permission !== 'denied' && (
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isActivating ? 'Activando...' : 'Activar'}
          </button>
        )}
        <button
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            isNightMode ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200/70'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
