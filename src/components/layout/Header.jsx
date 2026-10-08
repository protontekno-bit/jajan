import React from 'react';
import { ShoppingBag, Tag, Home, ReceiptText, User } from 'lucide-react';

/**
 * Responsive Header component.
 * Features desktop tab navigation on wider screens and compact app header on mobile.
 * @param {Object} props
 * @param {'home' | 'promo' | 'orders' | 'profile'} props.activeTab
 * @param {(tab: 'home' | 'promo' | 'orders' | 'profile') => void} props.onChangeTab
 * @param {number} props.cartCount
 * @param {() => void} props.onOpenCart
 */
export const Header = ({
  activeTab,
  onChangeTab,
  cartCount = 0,
  onOpenCart,
}) => {
  const desktopTabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'promo', label: 'Promo Spesial', icon: Tag },
    { id: 'orders', label: 'Pesanan Saya', icon: ReceiptText },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3 shadow-xs border-b border-orange-100/50">
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
        {/* Brand Logo */}
      <div
        onClick={() => onChangeTab('home')}
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        <div className="w-10 h-10 bg-gradient-to-tr from-[#FF7A00] to-[#FFC107] rounded-2xl flex items-center justify-center shadow-md text-white font-black text-lg tracking-tight">
          BJ
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#FF7A00] to-[#FF4B4B] leading-none">
            Beliyuk Jajan
          </h1>
          <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">
            Jajan Lezat & Cepat
          </p>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden sm:flex items-center gap-1 bg-white/70 backdrop-blur-xs p-1.5 rounded-full border border-orange-100/80 shadow-xs">
        {desktopTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FF7A00] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Actions: Cart & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cart Quick Button */}
        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-full bg-white text-gray-700 hover:text-[#FF7A00] shadow-xs border border-gray-100 transition-all btn-bounce hover:border-orange-200 cursor-pointer"
          aria-label="Buka Keranjang"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF4B4B] text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-xs animate-pop">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <div
          onClick={() => onChangeTab('profile')}
          className="w-10 h-10 rounded-full bg-white shadow-xs overflow-hidden border-2 border-[#FFC107] p-0.5 cursor-pointer hover:ring-2 hover:ring-[#FF7A00] transition-all"
        >
          <img
            src="https://i.pravatar.cc/100?img=3"
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
      </div>
    </header>
  );
};
