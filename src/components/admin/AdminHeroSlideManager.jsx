import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  UploadCloud,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor.js';

const DEFAULT_FORM_STATE = {
  id: '',
  badge: '✨ Pilihan Spesial',
  title: '',
  subtitle: '',
  img: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  targetCategory: 'all',
  ctaText: 'Lihat Menu',
  floatingBadge: '',
  isActive: true,
};

/**
 * Admin Panel Manager for Customizing Hero Banner Slides.
 * Allows administrators to add, edit, reorder, and upload representative photos
 * for each major menu category (Roti Bakar, Healthy Food, Es Kekinian).
 */
export const AdminHeroSlideManager = ({
  slides = [],
  categories = [],
  onAddSlide,
  onUpdateSlide,
  onDeleteSlide,
  onToggleActive,
  onMoveSlide,
  onResetSlides,
  isCloudActive = false,
  onSyncSlidesToCloud,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const fileInputRef = useRef(null);

  const activeCount = slides.filter((s) => s.isActive !== false).length;

  const handleOpenAdd = () => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      id: `slide-${Date.now()}`,
    });
    setEditingSlideId(null);
    setCompressionInfo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide) => {
    setFormData({ ...slide });
    setEditingSlideId(slide.id);
    setCompressionInfo(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Compress to optimal WebP/JPEG max 800px width for fast mobile hero display
      const result = await compressImageFile(file, 800, 600, 0.82);
      setFormData((prev) => ({ ...prev, img: result.dataUrl }));
      setCompressionInfo({
        sizeStr: result.compressedSizeStr,
        savings: result.savingsPercent,
      });
    } catch (err) {
      alert(`Gagal memproses gambar: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul slide banner wajib diisi!');
      return;
    }

    if (editingSlideId) {
      await onUpdateSlide(editingSlideId, formData);
    } else {
      await onAddSlide(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (slide) => {
    if (confirm(`Hapus slide "${slide.title}" secara permanen?`)) {
      await onDeleteSlide(slide.id);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Kembalikan semua slide banner ke preset resmi (Roti Bakar, Healthy Food, Es Kekinian)? Perubahan custom Anda akan ditimpa.'
      )
    ) {
      await onResetSlides();
    }
  };

  const handleSyncToCloud = async () => {
    if (!onSyncSlidesToCloud) return;
    try {
      setIsSyncing(true);
      setSyncNotice('⏳ Mengunggah semua slide ke Cloud Firestore...');
      await onSyncSlidesToCloud();
      setSyncNotice('✅ Sukses! Semua slide banner tersimpan di Cloud.');
      setTimeout(() => setSyncNotice(''), 3000);
    } catch (err) {
      setSyncNotice(`❌ Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Find category display label
  const getCategoryLabel = (catId) => {
    const found = categories.find((c) => c.id === catId);
    return found ? `${found.icon || '🏷️'} ${found.name}` : catId;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-black text-gray-800">
              Kelola Slide Banner Hero Beranda
            </h3>
          </div>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Sesuaikan slide carousel di bagian atas beranda pelanggan. Jelaskan setiap kategori menu utama (Roti Bakar, Healthy Food, Minuman), upload foto terbaik, dan atur tautan navigasi langsung.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-full bg-[#FF7A00] hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slide Baru</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 border border-gray-200 transition-all cursor-pointer"
            title="Kembalikan ke preset default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset Default</span>
          </button>

          {isCloudActive && onSyncSlidesToCloud && (
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sync ke Cloud'}</span>
            </button>
          )}
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-800 animate-fadeIn">
          {syncNotice}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Slide</p>
          <p className="text-xl font-black text-gray-800 mt-0.5">{slides.length} Banner</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slide Aktif</p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{activeCount} Tampil</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cloud Real-time</p>
          <p className="text-xl font-black text-blue-600 mt-0.5">
            {isCloudActive ? 'Tersambung ☁️' : 'Mode Lokal'}
          </p>
        </div>
      </div>

      {/* Slides Cards List */}
      <div className="space-y-3.5">
        {slides.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">Belum ada slide banner</p>
            <p className="text-xs text-gray-400 mt-1">
              Klik tombol "+ Tambah Slide Baru" atau "Reset Default" untuk mulai.
            </p>
          </div>
        ) : (
          slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`bg-white rounded-3xl border transition-all p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                slide.isActive === false
                  ? 'border-gray-200 opacity-60 bg-gray-50/50'
                  : 'border-gray-100 shadow-xs hover:border-orange-200'
              }`}
            >
              {/* Left Column: Reorder Controls + Thumbnail Preview */}
              <div className="flex items-center gap-3.5">
                {/* Reorder Up / Down */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveSlide(slide.id, 'up')}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-[#FF7A00] flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Geser ke atas"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => onMoveSlide(slide.id, 'down')}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-[#FF7A00] flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Geser ke bawah"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Miniature Thumbnail */}
                <div className="relative w-28 h-20 sm:w-32 sm:h-22 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs flex-shrink-0 bg-gray-100">
                  <img
                    src={slide.img}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    #{idx + 1}
                  </div>
                </div>

                {/* Slide Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00] border border-orange-200/60">
                      {slide.badge}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Arah: {getCategoryLabel(slide.targetCategory)}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-gray-800 truncate">
                    {slide.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1 max-w-md">
                    {slide.subtitle}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                    <span>Tombol: <b>"{slide.ctaText || 'Lihat Menu'}"</b></span>
                    {slide.floatingBadge && (
                      <span>• Badge: <b>"{slide.floatingBadge}"</b></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions (Toggle Active, Edit, Delete) */}
              <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
                <button
                  type="button"
                  onClick={() => onToggleActive(slide.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    slide.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={slide.isActive !== false ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                >
                  {slide.isActive !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Aktif</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      <span>Nonaktif</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(slide)}
                  className="p-2 rounded-xl text-gray-600 hover:text-[#FF7A00] hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Edit slide banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(slide)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Hapus slide banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-gray-800">
                  {editingSlideId ? 'Edit Slide Banner Hero' : 'Tambah Slide Banner Hero Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Badge Tag Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Badge Tag Atas (Highlight Kategori)
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="Contoh: 🥗 Healthy Food • Diet Friendly"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                  required
                />
              </div>

              {/* Title Headline Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Judul Utama Slide (Headline)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pilihan Sehat Setiap Hari! Sandwich & Meal Box 🥗"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                  required
                />
              </div>

              {/* Subtitle Description Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sub-Deskripsi (Penjelasan Menu)
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Contoh: Roti gandum isi telur dada ayam & bento meal box sayur brokoli wortel kaya serat dan tinggi protein."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                  required
                />
              </div>

              {/* Target Category & CTA Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kategori Menu Tujuan
                  </label>
                  <select
                    value={formData.targetCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, targetCategory: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value="all">Semua Menu</option>
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon || '🏷️'} {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Teks Tombol Aksi (CTA)
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Contoh: Lihat Menu Sehat 🥗"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              {/* Floating Badge on Image */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Badge Melayang Pada Foto (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.floatingBadge}
                  onChange={(e) =>
                    setFormData({ ...formData, floatingBadge: e.target.value })
                  }
                  placeholder="Contoh: 🥗 100% Bergizi & Segar atau ⭐ 4.9 Favorit"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              {/* Representative Photo Upload / URL */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Foto Representatif Kategori Menu
                  </label>
                  <span className="text-[10px] font-bold text-[#FF7A00] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                    Mendukung PNG 3D Transparan
                  </span>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
                  <span className="text-sm flex-shrink-0">✨</span>
                  <p className="leading-relaxed">
                    <strong>Tips Efek 3D Berkelas:</strong> Gunakan foto berformat <strong>PNG atau WebP tanpa background</strong> (latar transparan) untuk menghasilkan tampilan makanan melayang dengan bayangan 3D seperti iklan produk komersial.
                  </p>
                </div>

                {/* Upload Button + Hidden File Input */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span>{isCompressing ? 'Mengompres...' : 'Pilih Foto dari HP/PC'}</span>
                  </button>

                  <span className="text-[11px] text-gray-400">atau masukkan URL langsung:</span>
                </div>

                <input
                  type="text"
                  value={formData.img}
                  onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  placeholder="https://... atau /images/..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono focus:outline-none focus:border-[#FF7A00]"
                />

                {compressionInfo && (
                  <p className="text-[10px] text-emerald-600 font-bold">
                    ✓ Foto berhasil dikompresi ({compressionInfo.sizeStr}, hemat {compressionInfo.savings}%)
                  </p>
                )}

                {/* Live Preview Box */}
                {formData.img && (
                  <div className="relative mt-2 h-36 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={formData.img}
                      alt="Pratinjau Slide"
                      className="w-full h-full object-cover"
                    />
                    {formData.floatingBadge && (
                      <div className="absolute bottom-2 left-2 bg-white/95 px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-800 shadow-sm border border-orange-100">
                        {formData.floatingBadge}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slide-is-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#FF7A00] focus:ring-[#FF7A00] w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="slide-is-active"
                  className="text-xs font-bold text-gray-700 cursor-pointer select-none"
                >
                  Aktifkan slide ini di banner beranda
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editingSlideId ? 'Simpan Perubahan' : 'Tambahkan Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
