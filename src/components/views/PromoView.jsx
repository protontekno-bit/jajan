import React, { useState } from 'react';
import { Tag, Copy, Check, Percent, Truck, Flame, Sparkles, ShoppingBag } from 'lucide-react';
import { AVAILABLE_COUPONS } from '../../data/coupons.js';

/**
 * Promo vouchers & deals view tab.
 * Dynamically renders active promos or a delightful empty state.
 * @param {Object} props
 * @param {Array} [props.promos] - Dynamic active promos list
 * @param {() => void} props.onBackToCatalog
 */
export const PromoView = ({ promos = AVAILABLE_COUPONS, onBackToCatalog }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponIcon = (type) => {
    if (type === 'shipping' || type === 'truck') return Truck;
    if (type === 'percentage' || type === 'percent') return Percent;
    if (type === 'flame') return Flame;
    return Sparkles;
  };

  // If there are no active promos/vouchers
  if (!promos || promos.length === 0) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center animate-in fade-in duration-200">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-orange-100/70 border border-orange-200/60 flex items-center justify-center text-[#FF7A00] shadow-2xs">
          <Tag className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">
          Belum Ada Promo Aktif
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
          Nantikan kejutan promo diskon menarik, potongan harga, dan gratis ongkir berikutnya. 
          Yuk nikmati aneka varian Roti Bakar lezat favoritmu sekarang!
        </p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs sm:text-sm shadow-md btn-bounce transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Lihat Menu & Mulai Jajan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#FF7A00]" />
            Kupon & Promo Spesial
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Klaim kupon untuk jajan roti bakar lebih hemat hari ini! ({promos.length} aktif)
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="text-xs font-bold text-[#FF7A00] hover:underline cursor-pointer bg-transparent border-0"
        >
          Lihat Menu &rarr;
        </button>
      </div>

      {/* Vouchers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {promos.map((v) => {
          const Icon = getCouponIcon(v.iconType || v.discountType);
          const isCopied = v.code && copiedCode === v.code;
          const bgGradient = v.color || 'from-orange-500 to-amber-500';

          return (
            <div
              key={v.id || v.code}
              className="bg-white rounded-3xl p-5 border border-orange-100 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3.5 mb-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${bgGradient} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-gray-800 text-sm sm:text-base leading-tight truncate">
                      {v.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {v.desc || v.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-400 truncate">
                  Berlaku: <span className="font-semibold text-gray-600">{v.validUntil || 'Setiap Hari'}</span>
                </div>

                {v.code ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(v.code)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all btn-bounce cursor-pointer flex-shrink-0 ${
                      isCopied
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-orange-50 text-[#FF7A00] hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin: {v.code}
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    Otomatis Aktif
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
