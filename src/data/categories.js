/**
 * @fileoverview Categories Data Layer
 * Official Beliyuk Jajan Menu Categories & Emoji Presets
 */

/** @type {import('../types/index.js').Category[]} */
export const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'Semua Menu', icon: '🍞', order: 0 },
  { id: 'roti_bakar', name: 'Roti Bakar', icon: '🥪', order: 1 },
  { id: 'best_seller', name: 'Best Seller 👍', icon: '⭐', order: 2 },
  { id: 'minuman', name: 'Es Kekinian', icon: '🥤', order: 3 },
  { id: 'custom', name: 'Mix Rasa Request', icon: '✨', order: 4 },
  { id: 'healthy_food', name: 'Healthy Food', icon: '🥗', order: 5 },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export const CATEGORY_EMOJI_OPTIONS = [
  '🥗', '🥑', '🍎', '🥪', '🍞', '🥤', '☕', '⭐', '✨', '🍰', '🧇', '🍟', '🧀', '🍫', '🍓', '🔥', '🛵', '🥟', '🍜'
];
