import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Percent, Truck, Flame, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

const getPromoIcon = (iconType) => {
  switch (iconType) {
    case 'truck':
    case 'shipping':
      return Truck;
    case 'percent':
    case 'percentage':
      return Percent;
    case 'flame':
      return Flame;
    case 'sparkles':
      return Sparkles;
    default:
      return Tag;
  }
};

/**
 * Responsive & Calibrated Promo Banners Component.
 * - Mobile: Fluid horizontal swipe carousel with 82vw peek cue.
 * - Tablet & Desktop: Responsive grid (if <= 3 cards) or smooth scrollable carousel with chevrons.
 * - Auto-hides completely if there are no active promos.
 *
 * @param {Object} props
 * @param {Array} [props.promos] - Dynamic active promos list
 * @param {() => void} [props.onSelectPromo]
 */
export const PromoBanners = ({ promos = [], onSelectPromo }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [promos]);

  // Graceful auto-hide: If no promos exist or all are disabled, render nothing!
  if (!promos || promos.length === 0) {
    return null;
  }

  const isFewCards = promos.length <= 3;

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  return (
    <section className="mb-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FF7A00]" />
          <h3 className="text-base sm:text-lg font-black text-gray-800">
            Promo Menarik Untukmu
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!isFewCards && (
            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'bg-white hover:bg-orange-50 text-gray-700 shadow-2xs border border-gray-200 cursor-pointer'
                    : 'text-gray-300 opacity-40 cursor-not-allowed'
                }`}
                aria-label="Geser promo ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'bg-white hover:bg-orange-50 text-gray-700 shadow-2xs border border-gray-200 cursor-pointer'
                    : 'text-gray-300 opacity-40 cursor-not-allowed'
                }`}
                aria-label="Geser promo ke kanan"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onSelectPromo}
            className="text-xs font-bold text-[#FF7A00] hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            Lihat Semua ({promos.length}) &rarr;
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Soft edge fade cues for mobile horizontal swipe */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#FFF9F0] to-transparent pointer-events-none md:hidden z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#FFF9F0] to-transparent pointer-events-none md:hidden z-10" />

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={
            isFewCards
              ? 'flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1 -mx-1 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 touch-pan-x'
              : 'flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1 -mx-1 snap-x snap-mandatory touch-pan-x'
          }
        >
        {promos.map((card) => {
          const Icon = getPromoIcon(card.iconType || card.discountType);
          const bgGradient = card.color || card.bg || 'from-amber-500 to-orange-500';

          return (
            <div
              key={card.id || card.code}
              onClick={onSelectPromo}
              className={`flex-shrink-0 w-[82vw] sm:w-[290px] md:w-auto rounded-2xl p-4 bg-gradient-to-r ${bgGradient} text-white shadow-sm hover:shadow-md transition-all cursor-pointer snap-start relative overflow-hidden group flex flex-col justify-between`}
            >
              {/* Decorative circle glow */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />

              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {card.tag || 'Promo Spesial'}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h4 className="font-extrabold text-sm sm:text-base leading-tight mb-1 truncate">
                  {card.title}
                </h4>
                <p className="text-white/90 text-xs font-medium line-clamp-2">
                  {card.subtitle || card.desc}
                </p>
              </div>

              {card.code && (
                <div className="mt-3 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wide w-fit">
                  <span>KODE:</span>
                  <span className="underline">{card.code}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
};
