import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor.js';

/**
 * Advanced Product Image Uploader with:
 * 1. Drag & Drop file zone
 * 2. Mobile Camera direct capture
 * 3. File Explorer selection
 * 4. Web URL input tab
 * 5. Instant HTML5 Canvas compression with live savings metric badge
 *
 * @param {Object} props
 * @param {string} props.value - Current image URL or base64
 * @param {(newUrl: string) => void} props.onChange - Callback when image changes
 */
export const ProductImageUploader = ({ value = '', onChange, label = 'Foto Menu Produk' }) => {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMetrics, setCompressionMetrics] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setIsCompressing(true);
    try {
      const result = await compressImageFile(file, 500, 500, 0.78);
      onChange(result.dataUrl);
      setCompressionMetrics({
        original: result.originalSizeStr,
        compressed: result.compressedSizeStr,
        savings: result.savingsPercent,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses gambar.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setCompressionMetrics(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-gray-700 text-xs block">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-white text-[#FF7A00] shadow-2xs font-extrabold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unggah File / Kamera
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'url'
                ? 'bg-white text-[#FF7A00] shadow-2xs font-extrabold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Link URL Web
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          processFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          processFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* MODE 1: UPLOAD & CAMERA */}
      {activeMode === 'upload' && (
        <div>
          {value ? (
            /* PREVIEW STATE */
            <div className="relative rounded-2xl border-2 border-orange-200 bg-orange-50/30 p-3 flex items-center gap-3.5">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                <img
                  src={value}
                  alt="Pratinjau Menu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-gray-800">
                    Foto Siap Digunakan
                  </span>
                </div>

                {compressionMetrics ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>
                      {compressionMetrics.original} &rarr; {compressionMetrics.compressed} (Hemat {compressionMetrics.savings}%)
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">
                    Foto menu aktif di katalog pelanggan.
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#FF7A00] hover:border-orange-300 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ganti Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* DROPZONE & BUTTONS STATE */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                isDragging
                  ? 'border-[#FF7A00] bg-orange-50/80 scale-[1.01]'
                  : 'border-gray-300 hover:border-orange-300 bg-gray-50/60'
              }`}
            >
              {isCompressing ? (
                <div className="py-4 space-y-2">
                  <div className="w-8 h-8 mx-auto border-3 border-orange-200 border-t-[#FF7A00] rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-700">
                    Mengompresi foto & mengoptimalkan Canvas...
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Membuat ukuran WebP ringan untuk jaringan mobile Sangatta
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-gray-800">
                      Tarik & lepas foto menu ke sini
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Atau pilih metode pengambilan foto di bawah ini
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-[#FF7A00] text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#FF7A00]" />
                      <span>Galeri / PC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF7A00] hover:bg-[#e06c00] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Kamera HP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: URL INPUT */}
      {activeMode === 'url' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setCompressionMetrics(null);
              }}
              placeholder="https://images.unsplash.com/... atau link hosting"
              className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
            />
          </div>

          {value && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
              <img
                src={value}
                alt="Pratinjau Link"
                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500';
                }}
              />
              <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
                Pratinjau link aktif
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {/* Banner Edukasi Opsi 1 Gratis */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-850">
        <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p>
          <strong className="font-extrabold text-emerald-900">Opsi Gratis Aktif (Spark Plan):</strong> Foto otomatis dioptimalkan ke WebP (~15-20 KB), langsung tersimpan aman di Cloud Firestore tanpa biaya kartu kredit.
        </p>
      </div>
    </div>
  );
};
