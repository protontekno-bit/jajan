import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Send,
  CheckCircle2,
  MapPin,
  Store,
  MessageSquare,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { APP_CONFIG } from '../../config/constants.js';
import { generateWhatsAppLink } from '../../utils/whatsapp.js';
import { saveOrderToCloud } from '../../services/firebase.js';
import { useCustomerProfile } from '../../hooks/useCustomerProfile.js';
import { evaluateCoupon, AVAILABLE_COUPONS } from '../../data/coupons.js';

/**
 * Slide-over / Bottom sheet cart modal with Direct WhatsApp Checkout & Coupons.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import('../../types/index.js').CartItem[]} props.cart
 * @param {(productId: number, qty: number) => void} props.onUpdateQuantity
 * @param {(productId: number) => void} props.onRemoveItem
 * @param {() => void} props.onClearCart
 * @param {(orderData: Object) => void} props.onOrderPlaced
 * @param {number} props.totalItems
 * @param {number} props.totalPrice
 */
export const CartDrawerModal = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  totalItems,
  totalPrice,
  availableCoupons = AVAILABLE_COUPONS,
}) => {
  // Persistent Customer Profile from localStorage
  const { profile, updateProfile } = useCustomerProfile();
  const [customerName, setCustomerName] = useState(() => profile.name || '');
  const [customerPhone, setCustomerPhone] = useState(() => profile.phone || '');
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => profile.address || ''
  );
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Validation Errors State
  const [formErrors, setFormErrors] = useState({});

  // Coupon Voucher State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null);

  if (!isOpen) return null;

  // Sync profile edits to localStorage on input and clear errors
  const handleNameChange = (val) => {
    setCustomerName(val);
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: null }));
    }
    updateProfile({ name: val });
  };
  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: null }));
    }
    updateProfile({ phone: val });
  };
  const handleAddressChange = (val) => {
    setDeliveryAddress(val);
    if (formErrors.address) {
      setFormErrors((prev) => ({ ...prev, address: null }));
    }
    updateProfile({ address: val });
  };

  // Delivery Calculations
  const isFreeDelivery = totalPrice >= APP_CONFIG.freeDeliveryThreshold;
  const initialDeliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : APP_CONFIG.deliveryFee) : 0;

  // Coupon Discount Evaluation
  let discountAmount = 0;
  let effectiveDeliveryFee = initialDeliveryFee;

  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      const raw = (totalPrice * appliedCoupon.discountValue) / 100;
      discountAmount = Math.min(raw, appliedCoupon.maxDiscount);
    } else if (appliedCoupon.discountType === 'fixed') {
      discountAmount = Math.min(appliedCoupon.discountValue, totalPrice);
    } else if (appliedCoupon.discountType === 'shipping') {
      discountAmount = initialDeliveryFee;
      effectiveDeliveryFee = 0;
    }
  }

  const grandTotal = Math.max(
    0,
    totalPrice + effectiveDeliveryFee - (appliedCoupon?.discountType === 'shipping' ? 0 : discountAmount)
  );
  const progressToFree = Math.min(100, (totalPrice / APP_CONFIG.freeDeliveryThreshold) * 100);

  // Apply Coupon Handler
  const handleApplyCoupon = (code = couponCodeInput) => {
    if (!code || !code.trim()) {
      setCouponFeedback({ type: 'error', text: 'Masukkan kode kupon terlebih dahulu.' });
      return;
    }
    const res = evaluateCoupon(code, totalPrice, initialDeliveryFee, availableCoupons);
    if (res.valid) {
      setAppliedCoupon(res.coupon);
      setCouponCodeInput(res.coupon.code);
      setCouponFeedback({ type: 'success', text: res.message });
    } else {
      setAppliedCoupon(null);
      setCouponFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponFeedback(null);
  };

  // Strict Client-Side Checkout Form Validation
  const validateCheckoutForm = () => {
    const errors = {};
    const trimmedName = customerName.trim();
    // Clean non-digit characters from phone number
    const rawDigits = customerPhone.replace(/[^\d+]/g, '');
    const cleanDigits = rawDigits.replace(/\D/g, '');
    const trimmedAddress = deliveryAddress.trim();

    // 1. Validate Customer Name
    if (!trimmedName) {
      errors.name = 'Nama pemesan wajib diisi.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Nama pemesan minimal 2 karakter.';
    }

    // 2. Validate WhatsApp Number (Indonesia: 08xx, 628xx, +628xx, 9-14 digits)
    if (!rawDigits) {
      errors.phone = 'Nomor WhatsApp wajib diisi untuk verifikasi kasir.';
    } else {
      const isValidIndo = /^(\+?62|0)?8[1-9][0-9]{6,11}$/.test(rawDigits);
      if (!isValidIndo || cleanDigits.length < 9 || cleanDigits.length > 14) {
        errors.phone = 'Nomor WhatsApp tidak valid (contoh: 0812-3456-7890).';
      }
    }

    // 3. Validate Delivery Address (mandatory if Kurir delivery chosen)
    if (orderType === 'delivery') {
      if (!trimmedAddress) {
        errors.address = 'Alamat pengantaran wajib diisi lengkap untuk kurir.';
      } else if (trimmedAddress.length < 8) {
        errors.address = 'Mohon lengkapi alamat (nama jalan, no. rumah, atau patokan).';
      } else if (
        trimmedAddress.toLowerCase() === APP_CONFIG.storeAddress.toLowerCase()
      ) {
        errors.address = 'Mohon isi alamat rumah Anda di Sangatta (bukan alamat toko).';
      }
    }

    setFormErrors(errors);

    // Standardize phone number format for WhatsApp & Firestore
    const formattedPhone = cleanDigits.startsWith('62')
      ? cleanDigits
      : cleanDigits.startsWith('0')
      ? `62${cleanDigits.slice(1)}`
      : `62${cleanDigits}`;

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedName: trimmedName,
      sanitizedPhone: formattedPhone,
      displayPhone: rawDigits,
      sanitizedAddress: orderType === 'delivery' ? trimmedAddress : 'Ambil Langsung di Toko Beliyuk Jajan',
    };
  };

  const handleCheckoutToWhatsApp = () => {
    if (cart.length === 0) return;

    // Run strict validation
    const {
      isValid,
      sanitizedName,
      displayPhone,
      sanitizedAddress,
    } = validateCheckoutForm();

    if (!isValid) {
      // Auto-focus on first invalid input field
      setTimeout(() => {
        const errorInput = document.querySelector('[data-has-error="true"]');
        if (errorInput) {
          errorInput.focus();
          errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    // 1. Generate WhatsApp direct link with verified authentic details
    const waUrl = generateWhatsAppLink({
      items: cart,
      customerName: sanitizedName,
      customerPhone: displayPhone,
      orderType,
      deliveryAddress: sanitizedAddress,
      notes: notes.trim(),
      subtotal: totalPrice,
      deliveryFee: effectiveDeliveryFee,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : '',
      grandTotal,
    });

    const orderId = `BJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const orderPayload = {
      id: orderId,
      customerName: sanitizedName,
      customerPhone: displayPhone,
      orderType,
      address: sanitizedAddress,
      notes: notes.trim(),
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        selectedVariants: i.selectedVariants || {},
        selectedToppings: i.selectedToppings || [],
      })),
      subtotal: totalPrice,
      deliveryFee: effectiveDeliveryFee,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      total: grandTotal,
      status: 'Pesanan Baru 🔔',
    };

    // 2. Save order to Centralized Cloud Firestore Ledger
    saveOrderToCloud(orderPayload).catch((err) => {
      console.warn('Gagal mencatat order ke Firestore cloud:', err);
    });

    // 3. Record order into local customer device history
    if (onOrderPlaced) {
      onOrderPlaced(orderPayload);
    }

    // 4. Open WhatsApp link to send message to store owner
    window.open(waUrl, '_blank');

    // 5. Mark success & clear cart
    setIsSuccess(true);
    setTimeout(() => {
      onClearCart();
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer: Bottom sheet on mobile, slide-over on desktop */}
      <div className="relative w-full sm:max-w-md bg-white max-h-[92vh] sm:max-h-full h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-orange-50 text-[#FF7A00] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 text-base sm:text-lg leading-tight">
                Keranjang Belanja
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {totalItems} menu dipilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup keranjang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar (if delivery selected) */}
        {totalItems > 0 && orderType === 'delivery' && (
          <div className="px-5 sm:px-6 py-2.5 bg-amber-50/70 border-b border-amber-100/60">
            <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
              <span>
                {isFreeDelivery
                  ? '🎉 Anda berhak dapat Gratis Ongkir!'
                  : `Tambah ${formatRupiah(APP_CONFIG.freeDeliveryThreshold - totalPrice)} lagi untuk Gratis Ongkir`}
              </span>
            </div>
            <div className="w-full bg-amber-200/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className="bg-[#FF7A00] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressToFree}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-1">Pesanan Diteruskan ke WhatsApp!</h4>
              <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">
                Silakan kirim pesan di WhatsApp agar Admin Beliyuk Jajan segera menyiapkan pesanan Anda.
              </p>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-gray-700 mb-1">Keranjang masih kosong</h4>
              <p className="text-xs text-gray-400 mb-4">
                Pilih makanan atau minuman favorit Anda dari katalog.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-[#FF7A00] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Mulai Memilih Menu
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Menu Dipesan
                </h5>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <h6 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                        {item.name}
                      </h6>
                      <p className="text-xs font-extrabold text-[#FF7A00] mt-0.5">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-white text-gray-600 border border-gray-200 flex items-center justify-center hover:bg-gray-100 btn-bounce cursor-pointer"
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-bold text-xs text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center hover:bg-orange-600 btn-bounce cursor-pointer"
                        aria-label="Tambah kuantitas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery / Pickup Method Toggle */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <h5 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Metode Pemesanan
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orderType === 'delivery'
                        ? 'border-[#FF7A00] bg-orange-50 text-[#FF7A00] shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Diantar Kurir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orderType === 'pickup'
                        ? 'border-[#FF7A00] bg-orange-50 text-[#FF7A00] shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Ambil di Tempat</span>
                  </button>
                </div>
              </div>

              {/* Customer Details Form */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Informasi Pemesan
                  </h5>
                  <span className="text-[10px] text-gray-400 font-medium">Tersimpan otomatis</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Nama Pemesan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    data-has-error={!!formErrors.name}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                      formErrors.name
                        ? 'bg-red-50/40 border-red-400 focus:border-red-500 text-red-900'
                        : 'bg-gray-50 border-gray-200 focus:border-[#FF7A00] text-gray-800'
                    }`}
                    placeholder="Contoh: Kak Dinda / Kak Ryan"
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <span>•</span>
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    data-has-error={!!formErrors.phone}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                      formErrors.phone
                        ? 'bg-red-50/40 border-red-400 focus:border-red-500 text-red-900'
                        : 'bg-gray-50 border-gray-200 focus:border-[#FF7A00] text-gray-800'
                    }`}
                    placeholder="Contoh: 0812-3456-7890"
                  />
                  {formErrors.phone && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <span>•</span>
                      <span>{formErrors.phone}</span>
                    </p>
                  )}
                </div>

                {orderType === 'delivery' ? (
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Alamat Pengantaran di Sangatta <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      data-has-error={!!formErrors.address}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none resize-none transition-colors ${
                        formErrors.address
                          ? 'bg-red-50/40 border-red-400 focus:border-red-500 text-red-900'
                          : 'bg-gray-50 border-gray-200 focus:border-[#FF7A00] text-gray-800'
                      }`}
                      placeholder="Nama jalan, nomor rumah, gang/RT, patokan pengantaran"
                    />
                    {formErrors.address && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <span>•</span>
                        <span>{formErrors.address}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200 text-xs text-gray-700 space-y-1">
                    <p className="font-extrabold text-[#FF7A00] flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      Titik Pengambilan di Toko:
                    </p>
                    <p className="font-medium text-gray-800">{APP_CONFIG.storeAddress}</p>
                    <p className="text-[11px] text-gray-500">
                      Koordinat GPS: <span className="font-bold">{APP_CONFIG.storeCoordinatesStr}</span>
                    </p>
                    <a
                      href={APP_CONFIG.storeMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] text-[#FF7A00] font-bold hover:underline mt-1"
                    >
                      Buka Rute di Google Maps &rarr;
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Catatan Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                    placeholder="Contoh: Roti agak garing, saus dipisah"
                  />
                </div>
              </div>

              {/* SECTION KUPON PROMO HEMAT */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#FF7A00]" />
                    Punya Kupon Diskon?
                  </h5>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-red-500 font-bold hover:underline cursor-pointer"
                    >
                      Hapus Kupon
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-900 leading-tight">
                          {appliedCoupon.code} • Hemat {formatRupiah(discountAmount)}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">{appliedCoupon.title}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Ketik kode kupon (misal: BELIYUK50)"
                        className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold uppercase focus:outline-none focus:border-[#FF7A00]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Gunakan
                      </button>
                    </div>

                    {/* Kupon Rekomendasi Cepat */}
                    {availableCoupons.filter((cp) => cp.code && cp.isActive !== false).length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-medium">Saran:</span>
                        {availableCoupons
                          .filter((cp) => cp.code && cp.isActive !== false)
                          .slice(0, 4)
                          .map((cp) => (
                            <button
                              key={cp.code}
                              type="button"
                              onClick={() => handleApplyCoupon(cp.code)}
                              className="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF7A00] border border-orange-200 text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {cp.code}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Toast Inline */}
                {couponFeedback && (
                  <p
                    className={`text-[11px] font-medium ${
                      couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {couponFeedback.text}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer & WhatsApp Checkout Button */}
        {cart.length > 0 && !isSuccess && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 space-y-3 pb-safe flex-shrink-0">
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalItems} menu)</span>
                <span className="font-semibold text-gray-700">{formatRupiah(totalPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Kupon ({appliedCoupon?.code})</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Biaya Antar</span>
                <span className="font-semibold text-gray-700">
                  {orderType === 'pickup' ? (
                    <span className="text-gray-500 font-semibold">Ambil Sendiri (Rp 0)</span>
                  ) : effectiveDeliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">GRATIS ONGKIR</span>
                  ) : (
                    formatRupiah(effectiveDeliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-extrabold text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Total Pesanan</span>
                <span className="text-[#FF7A00]">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Validation Error Alert Banner */}
            {Object.keys(formErrors).length > 0 && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>Mohon lengkapi data pemesan bertanda bintang (*) di atas.</span>
              </div>
            )}

            {/* Direct to WhatsApp Button */}
            <button
              onClick={handleCheckoutToWhatsApp}
              className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 btn-bounce transition-all cursor-pointer text-xs sm:text-sm"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Pesan via WhatsApp ({formatRupiah(grandTotal)})</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center font-medium">
              Pesanan akan otomatis diformat dan dikirimkan ke WhatsApp Admin Toko
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
