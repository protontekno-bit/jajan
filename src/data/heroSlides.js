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

/** @type {HeroSlide[]} */
export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-roti-bakar',
    badge: '🍞 Roti Bakar Bandung & Crunchy',
    title: 'Mau Nyemil Enak? Roti Bakar Beliyuk! 🥪',
    subtitle:
      'Roti bakar tebal gurih dengan olesan Nutella lumer ganda, parutan keju melimpah, dan ChocoCrunch garing.',
    img: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    targetCategory: 'roti_bakar',
    ctaText: 'Pesan Roti Bakar 🥪',
    floatingBadge: '⭐ 4.9 Nutella & Chocomaltine',
    isActive: true,
    order: 0,
  },
  {
    id: 'slide-healthy-food',
    badge: '🥗 Healthy Food • Diet Friendly',
    title: 'Pilihan Sehat Setiap Hari! Sandwich & Meal Box 🥗',
    subtitle:
      'Sandwich gandum isi telur dada ayam & bento meal box sayur brokoli wortel kaya serat dan tinggi protein.',
    img: '/images/sandwich_gandum_ayam.jpg',
    targetCategory: 'healthy_food',
    ctaText: 'Lihat Menu Sehat 🥗',
    floatingBadge: '🥗 100% Bergizi & Segar',
    isActive: true,
    order: 1,
  },
  {
    id: 'slide-minuman',
    badge: '🥤 Es Kekinian Pelepas Dahaga',
    title: 'Segarkan Harimu dengan Minuman Dingin! 🥤',
    subtitle:
      'Aneka es segar dingin manis pas, teman paling nikmat untuk santap roti bakar dan makan siang.',
    img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    targetCategory: 'minuman',
    ctaText: 'Pilih Minuman Segar 🥤',
    floatingBadge: '❄️ Segar & Dingin Pas',
    isActive: true,
    order: 2,
  },
];
