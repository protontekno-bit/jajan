/**
 * @fileoverview Application Constants & Configuration
 * Provides centralized configuration values used across the application.
 */

export const APP_CONFIG = {
  name: 'Beliyuk Jajan',
  brandFullName: 'Beliyuk Roti Bakar',
  tagline: 'Nikmati gurihnya roti berpadu manisnya cokelat 🍞',
  subtitle: 'Roti bakar empuk dengan isian tebal melimpah. Dapat dimix sesuai request!',
  instagram: 'Beliyuk_eskekiniansegerr',
  currency: 'IDR',
  locale: 'id-ID',
  whatsappNumber: '6285128024754', // Nomor WhatsApp Toko Beliyuk Jajan (085128024754)
  whatsappDisplay: '0851-2802-4754',
  storeHours: '09:00 - 21:00 WITA',
  storeAddress:
    'G house no.151 Swarga Bara, Kec. Sangatta Utara, Kabupaten Kutai Timur, Kalimantan Timur 75683',
  storeCoordinates: {
    lat: 0.5186,
    lng: 117.5386,
  },
  storeCoordinatesStr: '0.5186, 117.5386',
  storeMapsUrl: 'https://maps.google.com/?q=0.5186,117.5386',
  storageKeys: {
    cart: 'beliyuk_cart_v1',
    orders: 'beliyuk_orders_v2', // bumped to v2 to purge legacy mock demo order
    products: 'beliyuk_products_v4', // bumped to v4 for healthy food sandwich & meal box rollout
    settings: 'beliyuk_settings_v3',
    promos: 'beliyuk_promos_v1',
    categories: 'beliyuk_categories_v1',
  },
  deliveryFee: 10000,
  freeDeliveryThreshold: 100000,
};
