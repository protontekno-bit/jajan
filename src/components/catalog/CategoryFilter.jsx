import React, { useRef, useEffect } from 'react';

/**
 * Mobile-First & Calibrated Category Filter.
 * - Mobile (< 768px): Sticky horizontal swipe carousel with snap, edge fade indicators,
 *   finger-friendly touch target, and smooth auto-scroll to center on selection.
 * - Desktop (>= 768px): All categories align seamlessly in 1 balanced row without awkward orphan wrap.
 *
 * @param {Object} props
 * @param {import('../../types/index.js').Category[]} props.categories
 * @param {string} props.activeCategory
 * @param {(categoryId: string) => void} props.onSelectCategory
 */
export const CategoryFilter = ({ categories = [], activeCategory, onSelectCategory }) => {
  const scrollContainerRef = useRef(null);
  const activeBtnRef = useRef(null);

  // Auto-scroll active category into viewport center on selection (critical for mobile UX)
  useEffect(() => {
    if (activeBtnRef.current && scrollContainerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeCategory]);

  return (
    <section className="sticky top-[54px] sm:top-[61px] z-30 bg-[#FFF9F0]/95 backdrop-blur-md pt-2 pb-2.5 mb-4 sm:mb-6 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-all border-b border-orange-100/60 shadow-[0_4px_12px_-4px_rgba(255,122,0,0.06)]">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-800 tracking-tight">
            Kategori Menu
          </h3>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#FF7A00] bg-orange-100 px-2 py-0.5 rounded-full">
            {categories.length} Pilihan
          </span>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold text-gray-400 select-none">
          Pilih untuk filter
        </span>
      </div>

      {/* Pill Container: Horizontal swipe on mobile, single clean row on desktop */}
      <div className="relative">
        {/* Soft edge fade cues for mobile touch */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#FFF9F0] to-transparent pointer-events-none md:hidden z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#FFF9F0] to-transparent pointer-events-none md:hidden z-10" />

        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-2 md:gap-2.5 overflow-x-auto hide-scrollbar pb-1 pt-0.5 px-0.5 snap-x snap-mandatory md:overflow-x-visible md:flex-wrap lg:flex-nowrap touch-pan-x"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                ref={isActive ? activeBtnRef : null}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-3.5 md:px-4 py-2 sm:py-2 md:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 btn-bounce cursor-pointer snap-start select-none min-h-[38px] ${
                  isActive
                    ? 'bg-[#FF7A00] text-white shadow-md shadow-orange-500/25 scale-[1.02] ring-2 ring-[#FF7A00]/25'
                    : 'bg-white text-gray-700 border border-gray-200 active:bg-orange-50 hover:border-orange-300 hover:bg-orange-50/50 shadow-2xs'
                }`}
              >
                <span className="text-sm sm:text-base leading-none">{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
