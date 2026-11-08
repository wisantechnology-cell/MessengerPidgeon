import React, { useEffect } from 'react';
import { BirdLogo } from './BirdLogo';
import { X, MessageSquare, ChevronRight } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export interface BirdNotification {
  id: string;
  title: string;
  body: string;
  avatarUrl?: string;
  chatId?: string;
}

interface BirdNotificationToastProps {
  notification: BirdNotification | null;
  onClose: () => void;
  onSelectChat?: (chatId: string) => void;
  isNightMode?: boolean;
}

export const BirdNotificationToast: React.FC<BirdNotificationToastProps> = ({
  notification,
  onClose,
  onSelectChat,
  isNightMode = false,
}) => {
  useEffect(() => {
    if (notification) {
      soundEffects.playBirdChirp();
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-6 duration-300">
      <div
        onClick={() => {
          if (notification.chatId && onSelectChat) {
            onSelectChat(notification.chatId);
          }
          onClose();
        }}
        className={`relative flex items-center justify-between p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl cursor-pointer transition-all active:scale-98 ${
          isNightMode
            ? 'bg-[#121824]/95 border-sky-500/30 text-[#dfe2ee]'
            : 'bg-white/95 border-sky-300 text-[#0c2340]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {notification.avatarUrl ? (
            <img
              src={notification.avatarUrl}
              alt={notification.title}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-400 shrink-0 shadow-md"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <BirdLogo className="w-6 h-6" />
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs truncate max-w-[200px]">
                {notification.title}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-400 text-[9px] font-extrabold uppercase tracking-wide shrink-0 flex items-center gap-1">
                <span>PidgeX</span>
                <span className="text-[10px]">🐦</span>
              </span>
            </div>
            <p className="text-xs truncate text-[#8d90a0] font-medium mt-0.5">
              {notification.body}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <ChevronRight className="w-4 h-4 text-sky-400" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
