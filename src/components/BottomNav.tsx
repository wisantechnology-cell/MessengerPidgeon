import React from 'react';
import { MessageSquare, Palette, Settings, Gamepad2, ShoppingBag } from 'lucide-react';

export type NavTab = 'chats' | 'marketplace' | 'games' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  unreadTotal: number;
  isNightMode?: boolean;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  unreadTotal,
  isNightMode = false,
  onSelectTab,
}) => {
  return (
    <nav className={`fixed bottom-0 w-full z-40 backdrop-blur-xl border-t transition-colors duration-300 ${
      isNightMode
        ? 'bg-[#0f131c]/90 border-white/5 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]'
        : 'bg-white/90 border-sky-200/80 shadow-[0_-4px_20px_rgba(2,132,199,0.08)]'
    }`}>
      <div className="h-16 max-w-[640px] mx-auto px-2 sm:px-4 flex items-center justify-around">
        {/* Tab 1: Chats */}
        <button
          onClick={() => onSelectTab('chats')}
          aria-current={activeTab === 'chats' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'chats'
              ? isNightMode ? 'text-[#b4c5ff] font-bold' : 'text-[#0284c7] font-bold'
              : isNightMode ? 'text-[#8d90a0] hover:text-[#dfe2ee]' : 'text-sky-800/70 hover:text-sky-950'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#0284c7] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {unreadTotal}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 font-medium">Chats</span>
        </button>

        {/* Tab 2: BirdMarketplace */}
        <button
          onClick={() => onSelectTab('marketplace')}
          aria-current={activeTab === 'marketplace' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'marketplace'
              ? 'text-cyan-500 dark:text-cyan-400 font-bold'
              : isNightMode ? 'text-[#8d90a0] hover:text-[#dfe2ee]' : 'text-sky-800/70 hover:text-sky-950'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 font-medium whitespace-nowrap">Marketplace</span>
        </button>

        {/* Tab 3: Sala De Espera (Mini Juegos) */}
        <button
          onClick={() => onSelectTab('games')}
          aria-current={activeTab === 'games' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'games'
              ? 'text-emerald-500 dark:text-emerald-400 font-bold'
              : isNightMode ? 'text-[#8d90a0] hover:text-[#dfe2ee]' : 'text-sky-800/70 hover:text-sky-950'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 font-medium whitespace-nowrap">Sala Espera</span>
        </button>

        {/* Tab 4: Ajustes */}
        <button
          onClick={() => onSelectTab('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center min-w-[50px] min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? isNightMode ? 'text-[#dfe2ee] font-bold' : 'text-[#0c2340] font-bold'
              : isNightMode ? 'text-[#8d90a0] hover:text-[#dfe2ee]' : 'text-sky-800/70 hover:text-sky-950'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-1 font-medium">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};

