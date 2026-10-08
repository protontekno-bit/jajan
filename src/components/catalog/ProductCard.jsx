import React from 'react';
import { Plus, Minus, Star, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { generateAskReadyLink } from '../../utils/whatsapp.js';

/**
 * Mobile-friendly Product Card with:
 * 1. "Tanya Ready?" 1-click WhatsApp inquiry.
 * 2. Variant customization modal trigger.
 * 3. Out of stock / Habis badge indicator.
 * @param {Object} props
 * @param {import('../../types/index.js').Product} props.product
 * @param {number} props.cartQuantity
 * @param {(product: import('../../types/index.js').Product) => void} props.onAddToCart
 * @param {(product: import('../../types/index.js').Product) => void} props.onOpenVariantModal
 * @param {(productId: number, newQty: number) => void} props.onUpdateQuantity
 * @param {string} [props.whatsappNumber]
 * @param {string} [props.storeName]
 */
export const ProductCard = ({
  product,
  cartQuantity = 0,
  onAddToCart,
  onOpenVariantModal,
  onUpdateQuantity,
  whatsappNumber,
  storeName,
}) => {
  const isAvailable = product.isAvailable !== false;
  const hasVariants = product.variants && product.variants.length > 0;

  const handleAskReady = (e) => {
    e.stopPropagation();
    const url = generateAskReadyLink(product, whatsappNumber, storeName);
    window.open(url, '_blank');
  };

  const handleAddClick = () => {
    if (!isAvailable) return;
    if (hasVariants) {
      onOpenVariantModal(product);
    } else {
      onAddToCart(product);
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs hover:shadow-md border border-gray-100 bounce-hover flex flex-col h-full group transition-all relative ${
        !isAvailable ? 'opacity-75' : ''
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 sm:mb-3 bg-gray-100">
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500';
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            !isAvailable ? 'grayscale-[60%]' : ''
          }`}
        />

        {/* Rating Badge */}
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-xs border border-gray-100/50">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FFC107] text-[#FFC107]" />
          <span className="text-gray-800">{product.rating}</span>
        </div>

        {/* Out of Stock Overlay Badge */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              Stok Habis
            </span>
          </div>
        )}

        {/* "Tanya Ready?" Quick WhatsApp Button */}
        <button
          onClick={handleAskReady}
          title="Tanya ketersediaan menu ini via WhatsApp"
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform btn-bounce cursor-pointer z-10"
          aria-label="Tanya ketersediaan ke WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <h4 className="font-bold text-gray-800 text-xs sm:text-base leading-snug line-clamp-1">
              {product.name}
            </h4>
          </div>

          {/* Has Variants Indicator Pill */}
          {hasVariants && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1">
              <SlidersHorizontal className="w-2.5 h-2.5" />
              Ada Pilihan Varian
            </span>
          )}

          {product.description && (
            <p className="text-gray-400 text-[11px] sm:text-xs line-clamp-1 mb-2 hidden sm:block">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action / Stepper */}
        <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold block uppercase">
              Harga
            </span>
            <span className="font-extrabold text-[#FF7A00] text-xs sm:text-sm md:text-base truncate block">
              {formatRupiah(product.price)}
            </span>
          </div>

          {/* Stepper or Add Button */}
          {!isAvailable ? (
            <button
              onClick={handleAskReady}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] sm:text-xs font-bold hover:bg-red-100 transition-colors btn-bounce cursor-pointer"
            >
              Tanya Stok
            </button>
          ) : cartQuantity > 0 && !hasVariants ? (
            <div className="flex items-center bg-orange-50 border border-orange-200 rounded-full p-0.5 sm:p-1 gap-1 animate-in fade-in zoom-in-90 duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, cartQuantity - 1);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-2xs btn-bounce cursor-pointer"
                aria-label="Kurangi pesanan"
              >
                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs sm:text-sm font-black text-[#FF7A00] px-1 sm:px-1.5 min-w-[16px] text-center">
                {cartQuantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, cartQuantity + 1);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FF7A00] text-white flex items-center justify-center hover:bg-[#e06c00] transition-colors shadow-2xs btn-bounce cursor-pointer"
                aria-label="Tambah pesanan"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-gradient-to-r from-[#FFC107] to-[#FF7A00] text-white flex items-center gap-1 shadow-sm hover:shadow-md btn-bounce focus:outline-none cursor-pointer"
              aria-label={`Tambah ${product.name} ke keranjang`}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="text-[11px] sm:text-xs font-bold sm:inline">
                {hasVariants ? 'Pilih' : 'Tambah'}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
