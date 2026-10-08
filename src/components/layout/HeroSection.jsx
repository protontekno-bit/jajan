import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Mobile-First & Calibrated Hero Section with quick search input and banner visual.
 * Optimized vertical footprint so customers see menu items faster.
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {(query: string) => void} props.onSearchChange
 */
export const HeroSection = ({ searchQuery, onSearchChange }) => {
  return (
    <section className="mb-4 sm:mb-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between bg-white p-3.5 sm:p-6 md:p-7 rounded-3xl shadow-[0_8px_30px_-10px_rgba(255,122,0,0.12)] relative overflow-hidden border border-orange-100/60">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FFC107]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 sm:w-7/12">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-orange-50 text-[#FF7A00] mb-2 border border-orange-200/60">
          🍞 Roti Bakar Bandung & Es Segar
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-1.5 leading-snug text-gray-800">
          Mau Nyemil Enak? <br className="hidden sm:inline" />
          <span className="text-[#FF7A00]">Beliyuk Roti Bakar! 🥪</span>
        </h2>
        <p className="text-gray-500 mb-3 sm:mb-5 font-medium text-xs sm:text-sm leading-relaxed max-w-lg mx-auto sm:mx-0">
          Roti bakar empuk gurih dengan isian tebal melimpah. Bisa dimix sesuai request!
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto sm:mx-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-full bg-[#F3F4F6] border border-transparent focus:border-[#FF7A00] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#FF7A00]/15 transition-all text-xs sm:text-sm font-medium placeholder-gray-400 text-gray-800"
            placeholder="Cari Nutella, Keju, ChocoCrunch, Es Segar..."
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="hidden sm:block sm:w-5/12 max-w-xs relative z-10 ml-6">
        <div className="relative group">
          <img
            src="https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
            alt="Hero Roti Bakar Beliyuk"
            className="w-full h-44 sm:h-48 object-cover rounded-2xl shadow-md group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute -bottom-2.5 -left-2.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-orange-100 flex items-center gap-1.5">
            <span className="text-base font-bold text-amber-500">⭐ 4.9</span>
            <span className="text-[11px] font-bold text-gray-700">Nutella & Chocomaltine</span>
          </div>
        </div>
      </div>
    </section>
  );
};
