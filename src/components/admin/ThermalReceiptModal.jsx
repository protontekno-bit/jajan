import React, { useState } from 'react';
import { X, Printer, Check, Copy, Store, Truck, MapPin, Phone } from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { APP_CONFIG } from '../../config/constants.js';

/**
 * Thermal Receipt POS Modal & Print Engine (58mm / 80mm)
 * Suitable for Bluetooth/USB thermal printers for both kitchen slips and courier delivery receipts.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.order - Full order object
 * @param {() => void} props.onClose
 * @param {string} [props.storeName]
 * @param {string} [props.whatsappNumber]
 */
export const ThermalReceiptModal = ({
  isOpen,
  order,
  onClose,
  storeName = APP_CONFIG.name,
  whatsappNumber = APP_CONFIG.whatsappNumber,
}) => {
  const [paperWidth, setPaperWidth] = useState('58'); // '58' | '80'
  const [slipMode, setSlipMode] = useState('full'); // 'full' (Kasir/Kurir) | 'kitchen' (Dapur)
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !order) return null;

  const dateFormatted = order.date || new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReceipt = () => {
    let txt = `================================\n`;
    txt += `   ${storeName.toUpperCase()}\n`;
    txt += `   Roti Bakar & Healthy Food Sangatta\n`;
    txt += `================================\n`;
    txt += `No. Nota : #${order.id}\n`;
    txt += `Waktu    : ${dateFormatted}\n`;
    txt += `Pemesan  : ${order.customerName || 'Pelanggan'}\n`;
    txt += `No. HP   : ${order.customerPhone || '-'}\n`;
    txt += `Metode   : ${order.orderType === 'delivery' ? 'Antar ke Alamat (Sangatta)' : 'Ambil di Toko'}\n`;
    if (order.address) txt += `Alamat   : ${order.address}\n`;
    if (order.notes) txt += `Catatan  : ${order.notes}\n`;
    txt += `--------------------------------\n`;
    (order.items || []).forEach((item, idx) => {
      txt += `${idx + 1}. ${item.quantity}x ${item.name} (${formatRupiah(item.price * item.quantity)})\n`;
      if (item.selectedVariants) {
        Object.entries(item.selectedVariants).forEach(([vName, opt]) => {
          txt += `   - ${vName}: ${opt.name}\n`;
        });
      }
      if (item.selectedToppings?.length > 0) {
        txt += `   + Topping: ${item.selectedToppings.map((t) => t.name).join(', ')}\n`;
      }
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal : ${formatRupiah(order.subtotal || order.total)}\n`;
    if (order.deliveryFee !== undefined) {
      txt += `Ongkir   : ${order.deliveryFee === 0 ? 'GRATIS' : formatRupiah(order.deliveryFee)}\n`;
    }
    if (order.discountAmount) {
      txt += `Diskon   : -${formatRupiah(order.discountAmount)}\n`;
    }
    txt += `TOTAL    : ${formatRupiah(order.total || 0)}\n`;
    txt += `================================\n`;
    txt += `  Terima Kasih Atas Pesanan Anda!\n`;

    navigator.clipboard?.writeText(txt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white">
      {/* Backdrop (hidden on print) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Dialog Box (hidden on print except receipt content) */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none print:w-auto print:static">
        {/* Modal Header & Options (screen only) */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF7A00] text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-gray-800">
                Cetak Struk Thermal POS
              </h3>
              <p className="text-[11px] text-gray-500">
                Kompatibel printer Bluetooth / USB kasir dapur & kurir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Bar: Width & Mode (screen only) */}
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5 print:hidden text-xs">
          {/* Slip Mode */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500 text-[11px]">Mode Struk:</span>
            <div className="bg-white p-0.5 rounded-xl border border-gray-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSlipMode('full')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  slipMode === 'full'
                    ? 'bg-[#FF7A00] text-white shadow-2xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kasir & Kurir
              </button>
              <button
                type="button"
                onClick={() => setSlipMode('kitchen')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  slipMode === 'kitchen'
                    ? 'bg-amber-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tiket Dapur 🍳
              </button>
            </div>
          </div>

          {/* Paper Width (58mm vs 80mm) */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500 text-[11px]">Lebar Kertas:</span>
            <div className="bg-white p-0.5 rounded-xl border border-gray-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaperWidth('58')}
                className={`px-2 py-1 rounded-lg font-mono font-bold text-[11px] cursor-pointer ${
                  paperWidth === '58'
                    ? 'bg-gray-800 text-white font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80')}
                className={`px-2 py-1 rounded-lg font-mono font-bold text-[11px] cursor-pointer ${
                  paperWidth === '80'
                    ? 'bg-gray-800 text-white font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* THE PRINTABLE THERMAL RECEIPT SLIP */}
          <div
            id="thermal-receipt-print-area"
            style={{
              width: paperWidth === '58' ? '58mm' : '80mm',
              maxWidth: paperWidth === '58' ? '58mm' : '80mm',
            }}
            className="bg-white p-3.5 sm:p-4 text-black font-mono text-[11px] sm:text-xs leading-tight shadow-md border border-dashed border-gray-300 print:shadow-none print:border-none print:p-1 print:m-0"
          >
            {/* Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-gray-400">
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase">
                {storeName}
              </h2>
              <p className="text-[10px] text-gray-600 font-sans mt-0.5">
                Roti Bakar & Healthy Food Sangatta
              </p>
              <p className="text-[9px] text-gray-500 mt-0.5">
                WA: +{whatsappNumber}
              </p>
              {slipMode === 'kitchen' && (
                <div className="mt-1.5 inline-block px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase rounded">
                  *** TIKET DAPUR / COOK ***
                </div>
              )}
            </div>

            {/* Order Metadata */}
            <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>No. Pesanan:</span>
                <span className="font-bold">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Order:</span>
                <span>{dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan :</span>
                <span className="font-bold truncate max-w-[120px]">
                  {order.customerName || 'Pelanggan'}
                </span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span>No. HP / WA:</span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Metode    :</span>
                <span className="font-bold">
                  {order.orderType === 'delivery' ? '🛵 Antar (Delivery)' : '🏬 Ambil di Toko'}
                </span>
              </div>
              {order.orderType === 'delivery' && order.address && (
                <div className="pt-1 text-[9px] leading-snug">
                  <span className="font-bold block">Alamat Antar:</span>
                  <span className="break-words">{order.address}</span>
                </div>
              )}
              {order.notes && (
                <div className="pt-1 text-[9px] bg-gray-50 p-1 border border-dashed border-gray-200">
                  <span className="font-bold block">💬 Catatan:</span>
                  <span className="italic break-words">{order.notes}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="py-2.5 space-y-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-[10px] uppercase flex justify-between pb-1 border-b border-gray-200">
                <span>Menu Item</span>
                {slipMode === 'full' && <span>Total</span>}
              </div>

              {(order.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold">
                      {item.quantity}x {item.name}
                    </span>
                    {slipMode === 'full' && (
                      <span className="font-bold whitespace-nowrap">
                        {formatRupiah((item.price || 0) * (item.quantity || 1))}
                      </span>
                    )}
                  </div>

                  {/* Variants */}
                  {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                    <div className="pl-3 text-[9px] text-gray-700">
                      {Object.entries(item.selectedVariants).map(([vName, opt]) => (
                        <div key={vName}>
                          • {vName}: <strong>{opt.name}</strong>
                          {slipMode === 'full' && opt.priceExtra
                            ? ` (+${formatRupiah(opt.priceExtra)})`
                            : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toppings */}
                  {item.selectedToppings && item.selectedToppings.length > 0 && (
                    <div className="pl-3 text-[9px] text-gray-700">
                      + Topping: <strong>{item.selectedToppings.map((t) => t.name).join(', ')}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary (Only in full mode) */}
            {slipMode === 'full' && (
              <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal Menu:</span>
                  <span>{formatRupiah(order.subtotal || order.total)}</span>
                </div>
                {order.deliveryFee !== undefined && (
                  <div className="flex justify-between">
                    <span>Biaya Ongkir:</span>
                    <span>{order.deliveryFee === 0 ? 'GRATIS' : formatRupiah(order.deliveryFee)}</span>
                  </div>
                )}
                {order.discountAmount ? (
                  <div className="flex justify-between text-gray-700">
                    <span>Diskon Kupon:</span>
                    <span>-{formatRupiah(order.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-baseline pt-1.5 text-xs font-black border-t border-gray-300">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="text-sm">{formatRupiah(order.total || 0)}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-gray-600 space-y-1">
              <p className="font-bold">*** TERIMA KASIH ***</p>
              <p>Simpan struk ini sebagai bukti transaksi sah Beliyuk Jajan Sangatta.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer (screen only) */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleCopyTextReceipt}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks Bon</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md btn-bounce cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
