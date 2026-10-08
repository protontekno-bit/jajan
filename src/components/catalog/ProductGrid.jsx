import React from 'react';
import { ProductCard } from './ProductCard.jsx';
import { Frown } from 'lucide-react';

/**
 * Grid component displaying filtered products or an empty state when none match.
 * @param {Object} props
 * @param {import('../../types/index.js').Product[]} props.products
 * @param {string} props.title
 * @param {(productId: number) => number} [props.getCartQuantity]
 * @param {(product: import('../../types/index.js').Product) => void} props.onAddToCart
 * @param {(product: import('../../types/index.js').Product) => void} props.onOpenVariantModal
 * @param {(productId: number, newQty: number) => void} props.onUpdateQuantity
 * @param {() => void} [props.onResetFilter]
 * @param {string} [props.whatsappNumber]
 * @param {string} [props.storeName]
 */
export const ProductGrid = ({
  products,
  title,
  getCartQuantity = () => 0,
  onAddToCart,
  onOpenVariantModal,
  onUpdateQuantity,
  onResetFilter,
  whatsappNumber,
  storeName,
}) => {
  return (
    <section className="mb-10 sm:mb-12">
      <div className="flex items-center justify-between mb-3.5 px-1">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
        <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-xs">
          {products.length} menu tersedia
        </span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-14 sm:py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-6 sm:p-8 shadow-xs">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-50 text-[#FF7A00] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Frown className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
            Oops! Menu tidak ditemukan
          </h4>
          <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
            Tidak ada makanan atau minuman yang cocok dengan pencarian Anda. Coba kata kunci lain atau reset filter.
          </p>
          {onResetFilter && (
            <button
              onClick={onResetFilter}
              className="px-5 py-2.5 rounded-full bg-[#FF7A00] text-white font-semibold text-xs sm:text-sm shadow-sm hover:bg-[#e06c00] transition-colors btn-bounce cursor-pointer"
            >
              Tampilkan Semua Menu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={getCartQuantity(product.id)}
              onAddToCart={onAddToCart}
              onOpenVariantModal={onOpenVariantModal}
              onUpdateQuantity={onUpdateQuantity}
              whatsappNumber={whatsappNumber}
              storeName={storeName}
            />
          ))}
        </div>
      )}
    </section>
  );
};
