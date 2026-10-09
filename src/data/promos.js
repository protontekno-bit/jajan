/**
 * Official Promo Banners & Voucher Coupons for Beliyuk Jajan
 */

export const GRADIENT_PRESETS = [
  { id: 'amber-orange', label: 'Oranye Hangat (Brand)', value: 'from-amber-500 to-orange-500' },
  { id: 'orange-rose', label: 'Sunset Oranye-Rose', value: 'from-orange-500 to-rose-500' },
  { id: 'rose-red', label: 'Merah Menyala (Sale)', value: 'from-rose-500 to-red-600' },
  { id: 'emerald-teal', label: 'Hijau Emerald (Segar)', value: 'from-emerald-500 to-teal-500' },
  { id: 'teal-mint', label: 'Mint Segar (Minuman Dingin)', value: 'from-teal-500 to-emerald-600' },
  { id: 'golden-tea', label: 'Kuning Madu / Teh Jeruk', value: 'from-amber-400 to-orange-500' },
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
 * Validates a coupon code or promo object against subtotal, delivery fee, and cart items.
 * Supports direct coupon codes, auto-promo by ID, expiry date validation, and minimum spend.
 *
 * @param {string|Object} rawIdentifier - Coupon code string or promo object / id
 * @param {number} subtotal - Cart subtotal amount
 * @param {number} [deliveryFee=0] - Current delivery fee
 * @param {Array} [promoList=DEFAULT_PROMOS] - Active promos list
 * @param {Array} [cartItems=[]] - Items currently in cart
 * @returns {{ valid: boolean, message: string, discount: number, coupon: Object|null }}
 */
export const evaluateCoupon = (
  rawIdentifier,
  subtotal,
  deliveryFee = 0,
  promoList = DEFAULT_PROMOS,
  cartItems = []
) => {
  if (!rawIdentifier) {
    return { valid: false, message: 'Pilih atau masukkan kode kupon terlebih dahulu.', discount: 0, coupon: null };
  }

  const cleanQuery = typeof rawIdentifier === 'string' ? rawIdentifier.trim().toUpperCase() : '';
  const promo = (promoList || DEFAULT_PROMOS).find((p) => {
    if (!p.isActive) return false;
    if (typeof rawIdentifier === 'object' && rawIdentifier.id) {
      return String(p.id) === String(rawIdentifier.id);
    }
    if (String(p.id) === String(rawIdentifier)) return true;
    return p.code && p.code.trim().toUpperCase() === cleanQuery;
  });

  if (!promo) {
    return {
      valid: false,
      message: `Kupon "${cleanQuery || 'Pilihan'}" tidak aktif atau tidak ditemukan.`,
      discount: 0,
      coupon: null,
    };
  }

  // 1. Cek masa berlaku tanggal kedaluwarsa (format YYYY-MM-DD jika diisi)
  if (promo.expiryDate) {
    const exp = new Date(promo.expiryDate);
    exp.setHours(23, 59, 59, 999);
    if (!isNaN(exp.getTime()) && Date.now() > exp.getTime()) {
      return {
        valid: false,
        message: `Masa berlaku promo "${promo.title}" telah berakhir.`,
        discount: 0,
        coupon: null,
      };
    }
  }

  // 2. Cek kuota pemakaian (jika disetel batas kuota)
  if (promo.usageLimit && promo.usageCount && Number(promo.usageCount) >= Number(promo.usageLimit)) {
    return {
      valid: false,
      message: `Kuota pemakaian kupon "${promo.code || promo.title}" sudah habis.`,
      discount: 0,
      coupon: null,
    };
  }

  // 3. Cek syarat minimal belanja
  const minOrder = Number(promo.minOrder) || 0;
  if (subtotal < minOrder) {
    const shortage = minOrder - subtotal;
    return {
      valid: false,
      message: `Min. belanja Rp ${minOrder.toLocaleString('id-ID')} untuk promo ${promo.code || promo.title}. Kurang Rp ${shortage.toLocaleString('id-ID')}.`,
      discount: 0,
      coupon: null,
    };
  }

  // 4. Cek cakupan kategori khusus (opsional)
  if (promo.targetCategory && promo.targetCategory !== 'all' && Array.isArray(cartItems) && cartItems.length > 0) {
    const hasCategoryItem = cartItems.some(
      (item) => item.category === promo.targetCategory || item.product?.category === promo.targetCategory
    );
    if (!hasCategoryItem) {
      return {
        valid: false,
        message: `Promo ini hanya berlaku untuk pesanan menu kategori khusus.`,
        discount: 0,
        coupon: null,
      };
    }
  }

  // 5. Kalkulasi diskon sesuai tipe promo
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
    message: `Promo "${promo.code || promo.title}" berhasil diterapkan! Hemat Rp ${calculatedDiscount.toLocaleString('id-ID')}`,
    discount: calculatedDiscount,
    coupon: promo,
  };
};
