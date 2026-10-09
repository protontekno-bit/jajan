/**
 * @fileoverview Default Hero Slides Data
 * Official Hero Slides showcasing Beliyuk Jajan's primary categories:
 * Roti Bakar, Healthy Food (Sandwich & Bento Meal Box), and Es Kekinian.
 */

/**
 * @typedef {Object} HeroSlide
 * @property {string} id - Unique identifier
 * @property {string} badge - Top highlight badge text
 * @property {string} title - Slide headline
 * @property {string} subtitle - Slide description
 * @property {string} img - Slide image URL or compressed local path
 * @property {string} targetCategory - Catalog category to filter when clicked
 * @property {string} ctaText - Call-to-action button text
 * @property {string} floatingBadge - Floating badge text on the image
 * @property {boolean} isActive - Whether the slide is enabled
 * @property {number} order - Display sequence
 */

/**
 * Preset Tema Warna Spotlight & Aksen untuk Slide Hero
 */
export const HERO_COLOR_THEMES = {
  orange: {
    id: 'orange',
    label: 'Warm Orange (Roti Bakar & Cemilan)',
    spotlightClass: 'bg-gradient-to-tr from-[#FF7A00]/30 to-[#FFC107]/25',
    ringClass: 'bg-orange-500/10 border-orange-300/40',
    badgeClass: 'bg-orange-50 text-[#FF7A00] border-orange-200/60',
    btnGradient: 'from-[#FF7A00] to-[#FF9800]',
    dotColor: '#FF7A00',
  },
  emerald: {
    id: 'emerald',
    label: 'Fresh Emerald (Healthy Food & Diet)',
    spotlightClass: 'bg-gradient-to-tr from-emerald-400/35 to-teal-400/20',
    ringClass: 'bg-emerald-500/10 border-emerald-300/40',
    badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    btnGradient: 'from-emerald-500 to-teal-600',
    dotColor: '#10B981',
  },
  amber: {
    id: 'amber',
    label: 'Golden Citrus / Tea (Es & Minuman Segar)',
    spotlightClass: 'bg-gradient-to-tr from-amber-400/35 to-orange-400/25',
    ringClass: 'bg-amber-500/10 border-amber-300/40',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    btnGradient: 'from-amber-500 to-orange-500',
    dotColor: '#F59E0B',
  },
  teal: {
    id: 'teal',
    label: 'Fresh Mint / Lime (Jeruk Nipis & Es Dingin)',
    spotlightClass: 'bg-gradient-to-tr from-teal-400/35 to-emerald-400/20',
    ringClass: 'bg-teal-500/10 border-teal-300/40',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/60',
    btnGradient: 'from-teal-500 to-emerald-600',
    dotColor: '#14B8A6',
  },
  rose: {
    id: 'rose',
    label: 'Berry Coral (Sirup Manis & Promo Spesial)',
    spotlightClass: 'bg-gradient-to-tr from-rose-400/35 to-pink-500/20',
    ringClass: 'bg-rose-500/10 border-rose-300/40',
    badgeClass: 'bg-rose-50 text-rose-600 border-rose-200/60',
    btnGradient: 'from-rose-500 to-pink-600',
    dotColor: '#F43F5E',
  },
};

/** @type {HeroSlide[]} */
export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-roti-bakar',
    badge: '🍞 Roti Bakar Bandung & Crunchy',
    title: 'Mau Nyemil Enak? Roti Bakar Beliyuk! 🥪',
    subtitle:
      'Roti bakar tebal gurih dengan olesan Nutella lumer ganda, parutan keju melimpah, dan ChocoCrunch garing.',
    img: '/images/hero_roti_bakar_3d.png',
    targetCategory: 'roti_bakar',
    ctaText: 'Pesan Roti Bakar 🥪',
    floatingBadge: '⭐ 4.9 Nutella & Keju Lumer',
    colorTheme: 'orange',
    isActive: true,
    order: 0,
  },
  {
    id: 'slide-healthy-food',
    badge: '🥗 Healthy Food • Diet Friendly',
    title: 'Pilihan Sehat Setiap Hari! Sandwich & Meal Box 🥗',
    subtitle:
      'Sandwich gandum isi telur dada ayam & bento meal box sayur brokoli wortel kaya serat dan tinggi protein.',
    img: '/images/hero_healthy_sandwich_3d.png',
    targetCategory: 'healthy_food',
    ctaText: 'Lihat Menu Sehat 🥗',
    floatingBadge: '🥗 100% Bergizi & Segar',
    colorTheme: 'emerald',
    isActive: true,
    order: 1,
  },
  {
    id: 'slide-minuman',
    badge: '🥤 Es Kekinian Pelepas Dahaga',
    title: 'Segarkan Harimu dengan Minuman Dingin! 🥤',
    subtitle:
      'Aneka es segar dingin manis pas, teman paling nikmat untuk santap roti bakar dan makan siang.',
    img: '/images/hero_es_segar_3d.png',
    targetCategory: 'minuman',
    ctaText: 'Pilih Minuman Segar 🥤',
    floatingBadge: '❄️ Segar & Dingin Pas',
    colorTheme: 'amber',
    isActive: true,
    order: 2,
  },
];
