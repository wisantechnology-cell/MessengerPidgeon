import React from 'react';
import { MessageSquare, Settings, Gamepad2, ShoppingBag, Newspaper } from 'lucide-react';

export type NavTab = 'chats' | 'marketplace' | 'games' | 'news' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  unreadTotal: number;
  isNightMode?: boolean;
  isClassicMode?: boolean;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  unreadTotal,
  isNightMode = false,
  isClassicMode = false,
  onSelectTab,
}) => {
  const inactiveClass = isNightMode
    ? 'text-[#8e98ab] hover:text-[#e2e8f0]'
    : 'text-[#64748b] hover:text-[#0f172a]';

  const activeClass = isNightMode
    ? 'text-[#38bdf8] font-semibold'
    : 'text-[#0284c7] font-semibold';

  return (
    <nav
      className={`fixed bottom-0 w-full z-40 border-t transition-colors duration-200 ${
        isNightMode
          ? 'bg-[#121722] border-white/10'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="h-16 max-w-[680px] mx-auto px-2 sm:px-4 flex items-center justify-around">
        {/* M.A.P.J STUDIOS Logo + Chats */}
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/M.A.P.J_STUDIOS_Logo_c7c7d920.PNG"
            alt="M.A.P.J STUDIOS"
            title="M.A.P.J STUDIOS"
            className="w-9 h-9 rounded-lg object-contain bg-[#ff7a00] border border-orange-400/40 shadow-sm shrink-0 select-none"
          />
          <button
            onClick={() => onSelectTab('chats')}
            aria-current={activeTab === 'chats' ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] transition-colors cursor-pointer ${
              activeTab === 'chats' ? activeClass : inactiveClass
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
              {unreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0284c7] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadTotal}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1">Chats</span>
          </button>
        </div>

        {!isClassicMode && (
          <>
            {/* Marketplace */}
            <button
              onClick={() => onSelectTab('marketplace')}
              aria-current={activeTab === 'marketplace' ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] transition-colors cursor-pointer ${
                activeTab === 'marketplace' ? activeClass : inactiveClass
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[11px] mt-1 whitespace-nowrap">Tienda</span>
            </button>

            {/* Sala Espera */}
            <button
              onClick={() => onSelectTab('games')}
              aria-current={activeTab === 'games' ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] transition-colors cursor-pointer ${
                activeTab === 'games' ? activeClass : inactiveClass
              }`}
            >
              <Gamepad2 className="w-5 h-5" />
              <span className="text-[11px] mt-1 whitespace-nowrap">Juegos</span>
            </button>

            {/* Noticias */}
            <button
              onClick={() => onSelectTab('news')}
              aria-current={activeTab === 'news' ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] transition-colors cursor-pointer ${
                activeTab === 'news' ? activeClass : inactiveClass
              }`}
            >
              <Newspaper className="w-5 h-5" />
              <span className="text-[11px] mt-1 whitespace-nowrap">Noticias</span>
            </button>
          </>
        )}

        {/* Ajustes */}
        <button
          onClick={() => onSelectTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] transition-colors cursor-pointer ${
            activeTab === 'settings' ? activeClass : inactiveClass
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] mt-1">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};
