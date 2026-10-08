import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';

/**
 * Sticky floating cart summary bar.
 * Positioned above bottom nav on mobile (bottom-20) and bottom-6 on desktop.
 * Appears dynamically when items are in cart.
 * @param {Object} props
 * @param {number} props.totalItems
 * @param {number} props.totalPrice
 * @param {boolean} props.isAnimating
 * @param {() => void} props.onOpenCart
 */
export const FloatingCartBar = ({
  totalItems,
  totalPrice,
  isAnimating,
  onOpenCart,
}) => {
  if (totalItems === 0) return null;

  return (
    <aside className="fixed bottom-20 sm:bottom-6 left-0 right-0 px-3 sm:px-4 z-40 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={onOpenCart}
        className="pointer-events-auto w-full max-w-md bg-[#2D3748] text-white rounded-full py-3 px-4 sm:px-6 flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.2)] transform transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer border border-gray-700"
        aria-label="Lihat Keranjang dan Checkout"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 bg-white/15 rounded-full flex items-center justify-center transition-transform ${
                isAnimating ? 'animate-pop' : ''
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 bg-[#FF4B4B] text-white text-xs font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#2D3748] animate-pop">
              {totalItems}
            </span>
          </div>

          <div className="text-left">
            <p className="text-[11px] text-gray-300 font-medium">Total Pesanan</p>
            <p className="font-extrabold text-[#FFC107] text-sm sm:text-base leading-tight">
              {formatRupiah(totalPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-bold bg-white text-[#2D3748] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full group-hover:bg-[#FFC107] transition-colors text-xs sm:text-sm shadow-xs">
          <span>Checkout</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </div>
      </button>
    </aside>
  );
};
