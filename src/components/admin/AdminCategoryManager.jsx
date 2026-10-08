import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  UploadCloud,
  Layers,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { CATEGORY_EMOJI_OPTIONS } from '../../data/categories.js';

/**
 * Dedicated Menu Category Manager for Admin Dashboard.
 * Allows adding, editing emoji/name, and deleting product categories.
 */
export const AdminCategoryManager = ({
  categories = [],
  products = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories,
  isCloudActive = false,
  onSyncCategoriesToCloud,
  onMoveCategory,
  onReorderCategoryToPosition,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🥪');
  const [formPosition, setFormPosition] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Custom categories (excluding 'all')
  const customCategories = categories.filter((c) => c.id !== 'all');

  // Count products per category
  const getProductCount = (catId) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => (p.category || '').toLowerCase() === catId.toLowerCase()).length;
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormIcon('🥪');
    setFormPosition(customCategories.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    const currentIdx = customCategories.findIndex((c) => c.id === cat.id);
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon || '🥪');
    setFormPosition(currentIdx !== -1 ? currentIdx + 1 : 1);
    setIsModalOpen(true);
  };

  const handleMove = async (catId, direction, catName) => {
    if (!onMoveCategory) return;
    try {
      await onMoveCategory(catId, direction);
      const dirText = direction === 'left' || direction === 'up' ? 'maju ke depan' : 'mundur ke belakang';
      setFeedbackMsg(`Posisi kategori "${catName}" digeser ${dirText}!`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      setFeedbackMsg(`Gagal memindahkan posisi: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, {
        name: formName.trim(),
        icon: formIcon.trim() || '🏷️',
      });

      // If user altered position in modal
      if (onReorderCategoryToPosition && formPosition) {
        await onReorderCategoryToPosition(editingCategory.id, Number(formPosition));
      }

      setFeedbackMsg(`Kategori "${formName.trim()}" berhasil diperbarui (Urutan #${formPosition})!`);
    } else {
      await onAddCategory({
        name: formName.trim(),
        icon: formIcon.trim() || '🏷️',
      });
      setFeedbackMsg(`Kategori "${formName.trim()}" berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleDelete = async (cat) => {
    if (cat.id === 'all') {
      alert('Kategori "Semua Menu" adalah kategori bawaan sistem dan tidak dapat dihapus.');
      return;
    }

    const count = getProductCount(cat.id);
    let confirmMsg = `Hapus kategori "${cat.name}"?`;
    if (count > 0) {
      confirmMsg += `\n\nPerhatian: Terdapat ${count} menu yang saat ini menggunakan kategori ini.`;
    }

    if (window.confirm(confirmMsg)) {
      await onDeleteCategory(cat.id);
      setFeedbackMsg(`Kategori "${cat.name}" telah dihapus.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const handleSyncCloud = async () => {
    if (!onSyncCategoriesToCloud) return;
    setIsSyncing(true);
    try {
      await onSyncCategoriesToCloud();
      setFeedbackMsg('✅ Seluruh kategori menu berhasil disinkronkan ke Cloud Firestore!');
    } catch (err) {
      setFeedbackMsg(`❌ Gagal sinkronisasi: ${err.message || 'Periksa koneksi'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-orange-100 shadow-xs space-y-3 mb-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <span>Kelola Kategori Menu</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF7A00]">
                {categories.length - 1} Kategori
              </span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Kategori yang aktif langsung muncul di pil filter beranda pelanggan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs flex items-center gap-1 shadow-2xs btn-bounce cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategori Baru</span>
          </button>

          {isCloudActive && onSyncCategoriesToCloud && (
            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-pointer disabled:opacity-50"
              title="Unggah Kategori ke Cloud Firestore"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Kembalikan kategori ke setelan default Beliyuk Jajan?')) {
                onResetCategories();
              }
            }}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
            title="Reset Kategori Default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* Mobile Priority Guide Banner */}
      <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-2.5 sm:p-3 flex items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#FF7A00] flex-shrink-0" />
          <div className="text-[11px] sm:text-xs leading-relaxed">
            <span className="font-extrabold text-amber-950">Prioritas Urutan Layar HP:</span>{' '}
            Kategori <strong>Urutan #1</strong> adalah yang pertama terlihat di layar HP pelanggan tanpa perlu di-slide. Gunakan tombol panah{' '}
            <strong className="text-[#FF7A00]">◀ Kiri / ▶ Kanan</strong> untuk menempatkan menu unggulan Anda di depan.
          </div>
        </div>
      </div>

      {/* Categories Reorderable List */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Pinned System Default: Semua Menu */}
        {categories.filter((c) => c.id === 'all').map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border bg-orange-50 border-orange-200 text-orange-950 font-bold text-xs shadow-2xs select-none"
            title="Kategori sistem default untuk menampilkan seluruh katalog"
          >
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF7A00] text-white px-1.5 py-0.5 rounded-md">
              Utama
            </span>
            <span className="text-base leading-none">{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-200/60 text-orange-900 font-mono font-bold">
              {getProductCount(cat.id)} menu
            </span>
          </div>
        ))}

        {/* Custom Categories with Reordering Controls */}
        {customCategories.map((cat, idx) => {
          const count = getProductCount(cat.id);
          const isFirst = idx === 0;
          const isLast = idx === customCategories.length - 1;
          const positionNumber = idx + 1;

          return (
            <div
              key={cat.id}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl border bg-white hover:bg-gray-50 border-gray-200 text-gray-800 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs group"
            >
              {/* Order Number Badge */}
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${
                  isFirst
                    ? 'bg-[#FF7A00] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={`Urutan #${positionNumber} di layar pembeli`}
              >
                #{positionNumber}
              </div>

              {/* Icon & Name */}
              <span className="text-base select-none leading-none">{cat.icon}</span>
              <span className="font-bold text-gray-900">{cat.name}</span>

              {/* Product Counter */}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono font-bold">
                {count}
              </span>

              {/* Action Controls: Move Left, Move Right, Edit, Delete */}
              <div className="flex items-center gap-0.5 ml-1 border-l border-gray-100 pl-1.5">
                {/* Move Left / Maju */}
                <button
                  type="button"
                  onClick={() => handleMove(cat.id, 'left', cat.name)}
                  disabled={isFirst}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isFirst
                      ? 'text-gray-200 cursor-not-allowed'
                      : 'text-gray-500 hover:text-[#FF7A00] hover:bg-orange-50 active:scale-95'
                  }`}
                  title={isFirst ? 'Sudah di posisi terdepan' : 'Geser maju ke depan (ke kiri)'}
                  aria-label={`Geser kategori ${cat.name} ke depan`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Move Right / Mundur */}
                <button
                  type="button"
                  onClick={() => handleMove(cat.id, 'right', cat.name)}
                  disabled={isLast}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isLast
                      ? 'text-gray-200 cursor-not-allowed'
                      : 'text-gray-500 hover:text-[#FF7A00] hover:bg-orange-50 active:scale-95'
                  }`}
                  title={isLast ? 'Sudah di posisi terakhir' : 'Geser mundur ke belakang (ke kanan)'}
                  aria-label={`Geser kategori ${cat.name} ke belakang`}
                >
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1 rounded-lg text-gray-400 hover:text-[#FF7A00] hover:bg-orange-50 cursor-pointer transition-colors"
                  title={`Edit kategori ${cat.name}`}
                  aria-label={`Edit ${cat.name}`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                  title={`Hapus kategori ${cat.name}`}
                  aria-label={`Hapus ${cat.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl z-10 space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#FF7A00]" />
                {editingCategory ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Snack & Cemilan, Kopi Susu"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:border-[#FF7A00]"
                  required
                  autoFocus
                />
              </div>

              {/* Posisi Urutan Menu di Layar HP */}
              {editingCategory && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Posisi Urutan Tampilan di HP
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-xs text-gray-800 focus:outline-none focus:border-[#FF7A00]"
                  >
                    {customCategories.map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Urutan #{idx + 1} {idx === 0 ? '⭐ (Paling Pertama Dilihat Pelanggan)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Urutan #1 akan langsung muncul di sisi paling kiri layar smartphone pembeli.
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Ikon Emoji
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-2xl flex items-center justify-center border border-orange-200 shadow-2xs">
                    {formIcon || '🏷️'}
                  </div>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    maxLength={3}
                    placeholder="Ketik emoji..."
                    className="w-24 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center text-sm font-bold focus:outline-none focus:border-[#FF7A00]"
                  />
                  <span className="text-[11px] text-gray-400">Pilih dari bawah atau ketik</span>
                </div>

                {/* Emoji presets */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-2xl border border-gray-100 max-h-28 overflow-y-auto hide-scrollbar">
                  {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                        formIcon === emoji
                          ? 'bg-[#FF7A00] text-white shadow-xs scale-110'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                {editingCategory ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
