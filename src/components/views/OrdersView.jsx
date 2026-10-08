import React from 'react';
import { ReceiptText, ShoppingBag, Send, ArrowRight, CheckCircle2, MapPin, Store } from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { generateWhatsAppLink } from '../../utils/whatsapp.js';

/**
 * Clean Order History & Digital Invoice tab view.
 * Replaces fake live driver tracking with realistic transaction receipts and WhatsApp follow-up.
 * @param {Object} props
 * @param {Array} props.orders
 * @param {() => void} props.onBackToCatalog
 * @param {() => void} props.onOpenCart
 * @param {number} props.cartCount
 */
export const OrdersView = ({
  orders = [],
  onBackToCatalog,
  onOpenCart,
  cartCount = 0,
  onClearOrders,
}) => {
  const handleFollowUpWhatsApp = (ord) => {
    const waUrl = generateWhatsAppLink({
      items: ord.items,
      customerName: ord.customerName || 'Pelanggan',
      customerPhone: ord.customerPhone || '-',
      orderType: ord.orderType || 'delivery',
      deliveryAddress: ord.address || '',
      notes: ord.notes || '',
      subtotal: ord.total,
      deliveryFee: 0,
      grandTotal: ord.total,
    });
    window.open(waUrl, '_blank');
  };

  return (
    <div className="py-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-[#FF7A00]" />
            Daftar & Riwayat Pesanan
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Daftar nota pesanan yang telah dikirimkan ke WhatsApp Toko
          </p>
        </div>

        {orders.length > 0 && onClearOrders && (
          <button
            onClick={() => {
              if (window.confirm('Bersihkan seluruh riwayat pesanan dari perangkat ini?')) {
                onClearOrders();
              }
            }}
            className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            Bersihkan Riwayat
          </button>
        )}
      </div>

      {/* Cart Active Banner if any */}
      {cartCount > 0 && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">Kamu punya {cartCount} menu di keranjang</h4>
              <p className="text-xs text-white/80">Kirimkan pesanan sekarang via WhatsApp!</p>
            </div>
          </div>
          <button
            onClick={onOpenCart}
            className="px-4 py-2 rounded-full bg-white text-gray-900 font-bold text-xs shadow-sm hover:bg-amber-100 btn-bounce cursor-pointer flex items-center gap-1.5"
          >
            <span>Buka Keranjang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-gray-200 p-6">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ReceiptText className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-gray-700 mb-1">Belum ada riwayat pesanan</h4>
          <p className="text-xs text-gray-400 mb-4">
            Pesanan yang Anda kirim ke WhatsApp akan tercatat rapi di sini.
          </p>
          <button
            onClick={onBackToCatalog}
            className="px-5 py-2.5 rounded-full bg-[#FF7A00] text-white font-semibold text-xs shadow-xs btn-bounce cursor-pointer"
          >
            Mulai Pesan Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all"
            >
              {/* Receipt Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-gray-800">{ord.id}</span>
                  <span className="text-xs text-gray-400">• {ord.date}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ord.status || 'Terkirim ke WhatsApp'}</span>
                </div>
              </div>

              {/* Items in order */}
              <div className="py-3 space-y-1.5">
                <p className="text-xs text-gray-400">Rincian Menu:</p>
                <div className="space-y-1">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-500">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Method info */}
                <div className="pt-2 flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  {ord.orderType === 'pickup' ? (
                    <>
                      <Store className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ambil Sendiri di Resto</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-[#FF7A00]" />
                      <span className="truncate">Antar ke: {ord.address}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-medium">Total Pesanan</span>
                  <span className="font-black text-sm sm:text-base text-[#FF7A00]">
                    {formatRupiah(ord.total)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFollowUpWhatsApp(ord)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/30 text-xs font-bold transition-all btn-bounce cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Chat Admin</span>
                  </button>
                  <button
                    onClick={onBackToCatalog}
                    className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-[#FF7A00] hover:text-[#FF7A00] text-xs font-bold transition-colors btn-bounce cursor-pointer"
                  >
                    Pesan Lagi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
