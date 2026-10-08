import { APP_CONFIG } from '../config/constants.js';
import { formatRupiah } from './currency.js';

/**
 * Generate 1-click WhatsApp link to ask product availability ("Ready gak?").
 * @param {import('../types/index.js').Product} product
 * @param {string} [whatsappNumber]
 * @param {string} [storeName]
 * @returns {string} wa.me URL
 */
export const generateAskReadyLink = (
  product,
  whatsappNumber = APP_CONFIG.whatsappNumber,
  storeName = APP_CONFIG.name
) => {
  const message = `Halo Admin *${storeName}*, mau tanya apakah menu *${product.name}* (${formatRupiah(product.price)}) hari ini ready/tersedia? Terima kasih. 🙏`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Format order details into a clean WhatsApp text message and generate wa.me link.
 * Includes variant and toppings breakdown per menu item.
 * @param {Object} orderData
 * @param {Array} orderData.items
 * @param {string} orderData.customerName
 * @param {string} orderData.customerPhone
 * @param {string} orderData.orderType - 'delivery' | 'pickup'
 * @param {string} orderData.deliveryAddress
 * @param {string} orderData.notes
 * @param {number} orderData.subtotal
 * @param {number} orderData.deliveryFee
 * @param {number} orderData.grandTotal
 * @param {string} [orderData.whatsappNumber]
 * @param {string} [orderData.storeName]
 * @returns {string} WhatsApp direct link
 */
export const generateWhatsAppLink = ({
  items,
  customerName = 'Pelanggan',
  customerPhone = '-',
  orderType = 'delivery',
  deliveryAddress = '',
  notes = '',
  subtotal,
  deliveryFee,
  discountAmount = 0,
  couponCode = '',
  grandTotal,
  gpsMapsUrl = '',
  whatsappNumber = APP_CONFIG.whatsappNumber,
  storeName = APP_CONFIG.name,
}) => {
  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const itemsList = items
    .map((item, idx) => {
      let details = `${idx + 1}. ${item.quantity}x ${item.name} (${formatRupiah(item.price * item.quantity)})`;

      // Append selected variants if any
      if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
        const variantLines = Object.entries(item.selectedVariants)
          .map(([varName, val]) => `   - ${varName}: ${val.name}${val.priceExtra ? ` (+${formatRupiah(val.priceExtra)})` : ''}`)
          .join('\n');
        details += `\n${variantLines}`;
      }

      // Append selected toppings if any
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        const toppingLines = item.selectedToppings
          .map((t) => `   + Topping: ${t.name} (+${formatRupiah(t.priceExtra)})`)
          .join('\n');
        details += `\n${toppingLines}`;
      }

      return details;
    })
    .join('\n\n');

  const discountLine = discountAmount > 0
    ? `Diskon Kupon (${couponCode}) : -${formatRupiah(discountAmount)}\n`
    : '';

  const message = `*PESANAN BARU - ${storeName.toUpperCase()}* 🥪🍞
Waktu: ${dateStr}
---------------------------------------------
*DATA PEMESAN:*
• Nama: ${customerName}
• No. HP: ${customerPhone}
• Metode: ${orderType === 'delivery' ? '🛵 Antar ke Alamat (Sangatta)' : '🏬 Ambil Sendiri (Pick-up)'}
${orderType === 'delivery' ? `• Alamat Antar: ${deliveryAddress}\n${gpsMapsUrl ? `• 📍 Titik GPS (Google Maps): ${gpsMapsUrl}\n` : ''}` : `• Titik Ambil Toko: ${APP_CONFIG.storeAddress}\n• Titik GPS Toko: ${APP_CONFIG.storeMapsUrl}\n`}${notes ? `• Catatan: ${notes}\n` : ''}---------------------------------------------
*RINCIAN MENU & VARIAN:*
${itemsList}

---------------------------------------------
Subtotal Menu : ${formatRupiah(subtotal)}
${discountLine}Biaya Antar   : ${orderType === 'delivery' ? (deliveryFee === 0 ? 'GRATIS ONGKIR' : formatRupiah(deliveryFee)) : 'Rp 0'}
*TOTAL BAYAR  : ${formatRupiah(grandTotal)}*
---------------------------------------------
Mohon dicek dan info nomor rekening / QRIS pembayaran ya, Admin. Terima kasih! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
};
