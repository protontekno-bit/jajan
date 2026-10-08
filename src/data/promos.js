/**
 * Official Promo Banners & Voucher Coupons for Beliyuk Jajan
 */

export const GRADIENT_PRESETS = [
  { id: 'amber-orange', label: 'Oranye Hangat (Brand)', value: 'from-amber-500 to-orange-500' },
  { id: 'orange-rose', label: 'Sunset Oranye-Rose', value: 'from-orange-500 to-rose-500' },
  { id: 'rose-red', label: 'Merah Menyala (Sale)', value: 'from-rose-500 to-red-600' },
  { id: 'emerald-teal', label: 'Hijau Emerald (Segar)', value: 'from-emerald-500 to-teal-500' },
  { id: 'indigo-purple', label: 'Ungu Elegan', value: 'from-indigo-500 to-purple-600' },
  { id: 'sky-blue', label: 'Biru Cerah', value: 'from-sky-500 to-blue-600' },
];

export const DEFAULT_PROMOS = [
  {
    id: 'promo-1',
    code: 'BELIYUK50',
    title: 'Diskon 50% Jajan Puas',
    subtitle: 'Min. belanja 40rb • Kode: BELIYUK50',
    desc: 'Maksimal potongan Rp 20.000 dengan min. transaksi Rp 40.000',
    tag: 'Spesial Hari Ini',
    iconType: 'percent', // 'percent' | 'truck' | 'flame' | 'sparkles'
    color: 'from-amber-500 to-orange-500',
    discountType: 'percentage', // 'percentage' | 'fixed' | 'shipping'
    discountValue: 50,
    maxDiscount: 20000,
    minOrder: 40000,
    validUntil: '31 Des 2026',
    isActive: true,
    showInBanner: true,
  },
  {
    id: 'promo-2',
    code: 'ONGKIR0',
    title: 'Gratis Ongkir Kilat',
    subtitle: 'Bebas biaya antar sepuasnya ke seluruh area',
    desc: 'Bebas biaya antar sepuasnya tanpa batas kuota',
    tag: 'Tanpa Kupon',
    iconType: 'truck',
    color: 'from-emerald-500 to-teal-500',
    discountType: 'shipping',
    discountValue: 100,
    maxDiscount: 10000,
    minOrder: 0,
    validUntil: 'Setiap Hari',
    isActive: true,
    showInBanner: true,
  },
  {
    id: 'promo-3',
    code: 'ROTIHEMAT',
    title: 'Flash Sale Sore Mantap',
    subtitle: 'Hemat Rp 5.000 untuk jajan roti bakar',
    desc: 'Potongan langsung Rp 5.000 untuk min. transaksi Rp 25.000',
    tag: 'Hemat 5Rb',
    iconType: 'flame',
    color: 'from-rose-500 to-red-600',
    discountType: 'fixed',
    discountValue: 5000,
    maxDiscount: 5000,
    minOrder: 25000,
    validUntil: '31 Des 2026',
    isActive: true,
    showInBanner: true,
  },
];

/**
 * Validates a coupon code against subtotal and delivery fee.
 * @param {string} rawCode
 * @param {number} subtotal
 * @param {number} [deliveryFee=0]
 * @param {Array} [promoList=DEFAULT_PROMOS]
 * @returns {{ valid: boolean, message: string, discount: number, coupon: Object|null }}
 */
export const evaluateCoupon = (rawCode, subtotal, deliveryFee = 0, promoList = DEFAULT_PROMOS) => {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, message: 'Masukkan kode kupon terlebih dahulu.', discount: 0, coupon: null };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  // Find active coupon with matching code
  const promo = (promoList || DEFAULT_PROMOS).find(
    (p) => p.isActive && p.code && p.code.trim().toUpperCase() === cleanCode
  );

  if (!promo) {
    return {
      valid: false,
      message: `Kode kupon "${cleanCode}" tidak aktif atau tidak ditemukan.`,
      discount: 0,
      coupon: null,
    };
  }

  const minOrder = Number(promo.minOrder) || 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      message: `Minimal belanja Rp ${minOrder.toLocaleString('id-ID')} untuk menggunakan kupon ${promo.code}.`,
      discount: 0,
      coupon: null,
    };
  }

  let calculatedDiscount = 0;
  if (promo.discountType === 'percentage') {
    const rawDiscount = (subtotal * (Number(promo.discountValue) || 0)) / 100;
    const maxDiscount = Number(promo.maxDiscount) || rawDiscount;
    calculatedDiscount = Math.min(rawDiscount, maxDiscount);
  } else if (promo.discountType === 'fixed') {
    calculatedDiscount = Math.min(Number(promo.discountValue) || 0, subtotal);
  } else if (promo.discountType === 'shipping') {
    calculatedDiscount = deliveryFee;
  }

  return {
    valid: true,
    message: `Kupon "${promo.code}" berhasil diterapkan! Hemat Rp ${calculatedDiscount.toLocaleString('id-ID')}`,
    discount: calculatedDiscount,
    coupon: promo,
  };
};
