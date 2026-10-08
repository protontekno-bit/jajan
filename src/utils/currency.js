/**
 * @fileoverview Currency Formatting Utilities
 * Pure functions for monetary conversions and formatting.
 */

/**
 * Format a number to Indonesian Rupiah currency string.
 * @param {number} amount - The numerical amount in IDR.
 * @returns {string} Formatted string (e.g. "Rp 45.000")
 */
export const formatRupiah = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
