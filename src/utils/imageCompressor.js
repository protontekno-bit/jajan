/**
 * Utility for compressing image files using HTML5 Canvas.
 * Supports WebP with JPEG fallback, calculates bandwidth savings,
 * and maintains aspect ratio for fast mobile loading on customer devices.
 *
 * @param {File} file - Selected image file
 * @param {number} maxWidth - Maximum width in px (default 600)
 * @param {number} maxHeight - Maximum height in px (default 600)
 * @param {number} quality - Quality scale 0.1 to 1.0 (default 0.8)
 * @returns {Promise<{
 *   dataUrl: string,
 *   originalSizeBytes: number,
 *   compressedSizeBytes: number,
 *   originalSizeStr: string,
 *   compressedSizeStr: string,
 *   savingsPercent: number,
 *   width: number,
 *   height: number
 * }>}
 */
export const compressImageFile = (file, maxWidth = 600, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih harus berupa gambar (JPG, PNG, WebP).'));
      return;
    }

    const originalSizeBytes = file.size;
    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat format file gambar.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio calculation
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const rawResult = e.target.result;
          resolve({
            dataUrl: rawResult,
            originalSizeBytes,
            compressedSizeBytes: originalSizeBytes,
            originalSizeStr: formatBytes(originalSizeBytes),
            compressedSizeStr: formatBytes(originalSizeBytes),
            savingsPercent: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        const isTransparentType =
          file.type === 'image/png' ||
          file.type === 'image/webp' ||
          file.type === 'image/gif';

        // Clear canvas to preserve transparent alpha pixels
        ctx.clearRect(0, 0, width, height);

        if (!isTransparentType) {
          // Only fill background with white for JPEG or opaque files
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try modern WebP first (which supports alpha transparency), fallback gracefully
        let compressedDataUrl = '';
        if (isTransparentType) {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            compressedDataUrl = canvas.toDataURL('image/png');
          }
        } else {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        }

        // Calculate approximate size in bytes of base64
        const base64Len = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const compressedSizeBytes = Math.round((base64Len * 3) / 4);

        const savingsPercent = Math.max(
          0,
          Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
        );

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeBytes,
          compressedSizeBytes,
          originalSizeStr: formatBytes(originalSizeBytes),
          compressedSizeStr: formatBytes(compressedSizeBytes),
          savingsPercent,
          width,
          height,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
