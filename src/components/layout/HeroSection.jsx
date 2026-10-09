import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { DEFAULT_HERO_SLIDES, HERO_COLOR_THEMES } from '../../data/heroSlides.js';

/**
 * High-Performance, Mobile-Gesture Aware Hero Carousel Section.
 * Built with zero bloated dependencies (~2 KB gzipped), pure React & hardware-accelerated CSS.
 * Features:
 * - Autoplay with pause-on-hover / pause-on-touch
 * - Touch swipe gestures with anti-accidental scroll protection
 * - Direct category filtering CTA ("Lihat Menu Ini")
 * - Dynamic spotlight themes (Warm Orange, Fresh Emerald, Cool Blue, etc.)
 * - 3D floating food commercial visual with crisp contrast
 * - Search bar with instant filter integration
 *
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {(query: string) => void} props.onSearchChange
 * @param {Array} [props.heroSlides] - Dynamic slides from Firebase / localStorage
 * @param {(categoryId: string) => void} [props.onSelectCategory]
 */
export const HeroSection = ({
  searchQuery,
  onSearchChange,
  heroSlides = [],
  onSelectCategory,
}) => {
  const slides = heroSlides && heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const safeIndex = currentIndex >= slides.length ? 0 : currentIndex;
  const currentSlide = slides[safeIndex] || slides[0];

  // Resolve dynamic color theme
  const themeKey =
    currentSlide.colorTheme ||
    (currentSlide.targetCategory === 'healthy_food'
      ? 'emerald'
      : currentSlide.targetCategory === 'minuman'
        ? 'blue'
        : 'orange');
  const currentTheme = HERO_COLOR_THEMES[themeKey] || HERO_COLOR_THEMES.orange;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay with tab visibility awareness to save client CPU & battery
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      nextSlide();
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length, nextSlide]);

  // Mobile Touch Swipe Handlers with Anti-Accidental Scroll Guard
  const handleTouchStart = (e) => {
    if (!e.touches?.[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      setIsPaused(false);
      return;
    }
    const touch = e.changedTouches?.[0];
    if (touch) {
      const diffX = touch.clientX - touchStartX.current;
      const diffY = touch.clientY - touchStartY.current;

      // Anti-accidental swipe: hanya picu jika perpindahan horizontal dominan
      // (diffX > 45px dan minimal 1.4x lebih besar dari perpindahan vertikal)
      // Ini mencegah pergantian banner saat pelanggan sedang scroll halaman ke bawah
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
        if (diffX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setIsPaused(false);
  };

  const handleSlideCtaClick = () => {
    if (onSelectCategory && currentSlide.targetCategory) {
      onSelectCategory(currentSlide.targetCategory);
      const catalogEl = document.getElementById('catalog-products-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section
      className="mb-4 sm:mb-6 bg-white p-3.5 sm:p-6 md:p-7 rounded-3xl shadow-[0_8px_30px_-10px_rgba(255,122,0,0.12)] relative overflow-hidden border border-orange-100/60 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Banner Pilihan Menu Utama"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FFC107]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar on Mobile & Desktop: Category Badge, Slide Counter & Quick Nav */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 ${currentTheme.badgeClass}`}
          >
            {currentSlide.badge || '✨ Pilihan Spesial Beliyuk'}
          </span>

          {slides.length > 1 && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-full">
              {safeIndex + 1} / {slides.length}
            </span>
          )}
        </div>

        {/* Quick Nav Controls on Top Right for Mobile & Desktop */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevSlide}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 hover:bg-orange-100 hover:text-[#FF7A00] text-gray-600 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 hover:bg-orange-100 hover:text-[#FF7A00] text-gray-600 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              aria-label="Slide selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Side-by-Side on BOTH Mobile (<640px) and Desktop (>=640px) */}
      <div className="relative z-10 flex flex-row items-center justify-between gap-2.5 sm:gap-6">
        {/* Left Column: Headline, Subtitle, CTA */}
        <div className="w-[56%] sm:w-7/12 text-left">
          {/* Headline */}
          <h2 className="text-sm sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2 leading-snug sm:leading-snug text-gray-800 transition-opacity duration-300 line-clamp-2 sm:line-clamp-none">
            {currentSlide.title}
          </h2>

          {/* Subtitle */}
          <p className="text-gray-500 mb-2 sm:mb-4 font-medium text-[10px] sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none max-w-lg">
            {currentSlide.subtitle}
          </p>

          {/* Direct Category Jump CTA Button */}
          {currentSlide.ctaText && (
            <button
              type="button"
              onClick={handleSlideCtaClick}
              className={`inline-flex px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-gradient-to-r ${currentTheme.btnGradient} text-white font-bold text-[10px] sm:text-xs shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap`}
              title={`Lihat menu ${currentSlide.targetCategory}`}
            >
              <span>{currentSlide.ctaText}</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Right Column: 3D Commercial Food Stage */}
        <div className="w-[44%] sm:w-5/12 max-w-xs relative flex flex-col items-center justify-center">
          <div
            className="relative group cursor-pointer w-full flex flex-col items-center justify-center select-none"
            onClick={handleSlideCtaClick}
            title="Klik untuk melihat menu kategori ini"
          >
            {/* 3D Radial Spotlight Glow Behind Product */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-32 sm:w-56 h-32 sm:h-56 rounded-full blur-xl sm:blur-2xl transition-all duration-700 ${currentTheme.spotlightClass}`}
              />
              <div
                className={`w-24 sm:w-44 h-24 sm:h-44 rounded-full border shadow-inner blur-xs transition-all duration-700 ${currentTheme.ringClass}`}
              />
            </div>

            {/* 3D Floating Product Object with Continuous Keyframe Animation */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center py-1">
              <img
                key={currentSlide.id}
                src={currentSlide.img}
                alt={currentSlide.title}
                fetchPriority={safeIndex === 0 ? 'high' : 'auto'}
                loading={safeIndex === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/hero_roti_bakar_3d.png';
                }}
                className="max-h-32 sm:max-h-48 md:max-h-52 w-auto max-w-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.22)] animate-float-3d group-hover:scale-108 transition-all duration-500 ease-out mix-blend-multiply"
              />

              {/* Realistic Oval Contact Shadow with Pulsing Keyframe */}
              <div className="w-24 sm:w-44 h-2 sm:h-4 bg-radial from-black/32 via-black/12 to-transparent rounded-full blur-[2px] mt-1 sm:mt-1.5 animate-shadow-pulse pointer-events-none" />
            </div>

            {/* Floating 3D Micro-Badge */}
            {currentSlide.floatingBadge && (
              <div className="absolute -bottom-1 left-0 sm:-left-1 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-[0_6px_16px_-4px_rgba(0,0,0,0.16)] border border-white/90 flex items-center gap-1 z-20 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none">
                <span className="text-[9px] sm:text-[11px] font-extrabold text-gray-800 whitespace-nowrap">
                  {currentSlide.floatingBadge}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Full-width Quick Search Bar & Dot Indicators */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        {/* Full-width Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-full bg-[#F3F4F6] border border-transparent focus:border-[#FF7A00] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/15 transition-all text-xs font-medium placeholder-gray-400 text-gray-800"
            placeholder="Cari Roti Bakar, Sandwich Gandum, Meal Box, Es Segar..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dot Indicators */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  safeIndex === idx
                    ? 'w-6 h-2 bg-[#FF7A00]'
                    : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label={`Pindah ke slide ${idx + 1}: ${slide.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
