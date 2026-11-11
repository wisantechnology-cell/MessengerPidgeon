import React, { useEffect } from 'react';
import { requestNotificationPermission } from '../utils/nativeNotifications';

interface NotificationPermissionBannerProps {
  isNightMode?: boolean;
}

/**
 * Componente silencioso de permisos y notificaciones nativas.
 * Mantiene la lógica activa en segundo plano sin mostrar ningún mensaje visual invasivo en pantalla.
 */
export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = () => {
  useEffect(() => {
    // Solicitar permiso de forma transparente en segundo plano si aún no está definido
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          Notification.requestPermission().catch(() => {});
        } catch {}
      }
    }
  }, []);

  // Oculto por completo de la pantalla según la indicación del usuario
  return null;
};
