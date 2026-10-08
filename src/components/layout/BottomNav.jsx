import React from 'react';
import { Home, Tag, ReceiptText, User } from 'lucide-react';

/**
 * Mobile-friendly Bottom Navigation Bar (like GoFood / GrabFood).
 * Displayed exclusively on mobile screens (sm:hidden).
 * @param {Object} props
 * @param {'home' | 'promo' | 'orders' | 'profile'} props.activeTab
 * @param {(tab: 'home' | 'promo' | 'orders' | 'profile') => void} props.onChangeTab
 * @param {number} props.cartCount
 */
export const BottomNav = ({ activeTab, onChangeTab, cartCount = 0 }) => {
  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'promo', label: 'Promo', icon: Tag, badge: '50%' },
    { id: 'orders', label: 'Pesanan', icon: ReceiptText, count: cartCount },
    { id: 'profile', label: 'Akun', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/70 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-area-pb">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-all duration-200 cursor-pointer ${
                isActive ? 'text-[#FF7A00]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />

                {/* Promo Badge */}
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-3.5 bg-[#FF4B4B] text-white text-[9px] font-black px-1 rounded-full leading-tight">
                    {tab.badge}
                  </span>
                )}

                {/* Cart / Orders Live Count Badge */}
                {tab.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#FF7A00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pop">
                    {tab.count > 9 ? '9+' : tab.count}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 tracking-tight transition-all ${
                  isActive ? 'text-[#FF7A00] font-bold scale-105' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <span className="w-4 h-0.5 bg-[#FF7A00] rounded-full mt-0.5 animate-in fade-in zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
