import React, { useState } from 'react';
import {
  Tag,
  Percent,
  Truck,
  Flame,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  UploadCloud,
  Eye,
  EyeOff,
  Power,
  Gift,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { GRADIENT_PRESETS } from '../../data/promos.js';
import { DEFAULT_CATEGORIES } from '../../data/categories.js';

const ICON_OPTIONS = [
  { id: 'percent', label: 'Persen (%)', icon: Percent },
  { id: 'truck', label: 'Truk Ongkir', icon: Truck },
  { id: 'flame', label: 'Api Sale', icon: Flame },
  { id: 'sparkles', label: 'Kilau Bintang', icon: Sparkles },
  { id: 'tag', label: 'Label Diskon', icon: Tag },
];

const renderIcon = (iconType, className = 'w-4 h-4') => {
  switch (iconType) {
    case 'truck':
    case 'shipping':
      return <Truck className={className} />;
    case 'percent':
    case 'percentage':
      return <Percent className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Tag className={className} />;
  }
};

const DEFAULT_FORM_STATE = {
  id: '',
  title: '',
  subtitle: '',
  desc: '',
  tag: 'Promo Spesial',
  code: '',
  discountType: 'percentage', // 'percentage' | 'fixed' | 'shipping'
  discountValue: 20,
  maxDiscount: 15000,
  minOrder: 30000,
  validUntil: '31 Des 2026',
  expiryDate: '', // Format YYYY-MM-DD
  usageLimit: 0, // 0 = unlimited kuota
  targetCategory: 'all', // 'all' atau ID kategori spesifik
  color: 'from-amber-500 to-orange-500',
  iconType: 'percent',
  isActive: true,
  showInBanner: true,
};

/**
 * Dedicated Promo & Voucher Coupon Manager for Admin Dashboard.
 */
export const AdminPromoManager = ({
  promos = [],
  onToggleActive,
  onToggleBanner,
  onAddPromo,
  onUpdatePromo,
  onDeletePromo,
  onResetPromos,
  isCloudActive = false,
  onSyncPromosToCloud,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  // Metrics
  const totalPromos = promos.length;
  const activeCount = promos.filter((p) => p.isActive).length;
  const bannerCount = promos.filter((p) => p.isActive && p.showInBanner !== false).length;
  const couponCount = promos.filter((p) => p.isActive && p.code).length;

  const handleOpenAdd = () => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      id: `promo-${Date.now()}`,
    });
    setEditingPromoId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      ...promo,
    });
    setEditingPromoId(promo.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload = {
      ...formData,
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      desc: formData.desc.trim() || formData.subtitle.trim(),
      tag: formData.tag.trim() || 'Promo',
      code: formData.code.trim().toUpperCase(),
      discountValue: Number(formData.discountValue) || 0,
      maxDiscount: Number(formData.maxDiscount) || 0,
      minOrder: Number(formData.minOrder) || 0,
      expiryDate: formData.expiryDate ? formData.expiryDate.trim() : '',
      usageLimit: Number(formData.usageLimit) || 0,
      targetCategory: formData.targetCategory || 'all',
    };

    if (editingPromoId) {
      await onUpdatePromo(editingPromoId, payload);
    } else {
      await onAddPromo(payload);
    }

    setIsModalOpen(false);
  };

  const handleSyncToCloud = async () => {
    if (!onSyncPromosToCloud) return;
    setIsSyncing(true);
    setSyncNotice('');
    try {
      await onSyncPromosToCloud();
      setSyncNotice('✅ Seluruh promo berhasil disinkronkan ke Firebase Cloud Firestore!');
    } catch (err) {
      setSyncNotice(`❌ Gagal sinkronisasi: ${err.message || 'Periksa koneksi'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(''), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF7A00] flex items-center justify-center flex-shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Promo</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800">{totalPromos}</h3>
            <span className="text-[10px] text-gray-500 font-medium">Dalam Sistem</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Promo Aktif</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{activeCount}</h3>
            <span className="text-[10px] text-gray-500 font-medium">Dapat Diklaim</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Banner Beranda</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600">{bannerCount}</h3>
            <span className="text-[10px] text-gray-500 font-medium">
              {bannerCount === 0 ? 'Banner Auto-Hide' : 'Tampil di Carousel'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kupon Siap Pakai</p>
            <h3 className="text-xl sm:text-2xl font-black text-purple-600">{couponCount}</h3>
            <span className="text-[10px] text-gray-500 font-medium">Auto-Validasi Cart</span>
          </div>
        </div>
      </div>

      {/* Action Header & Explanations */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF7A00]" />
              Manajemen Promo & Kupon Diskon Beliyuk
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Atur promo banner yang muncul di halaman beranda pelanggan serta kupon diskon checkout. 
              <strong> Jika semua promo dimatikan, bagian banner promo di beranda akan otomatis disembunyikan (auto-hide).</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm btn-bounce cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Promo Baru</span>
            </button>

            {isCloudActive && onSyncPromosToCloud && (
              <button
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm btn-bounce cursor-pointer disabled:opacity-50 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Unggah ke Cloud'}</span>
              </button>
            )}

            <button
              onClick={onResetPromos}
              className="px-3.5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Kembalikan promo default resmi Beliyuk Jajan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {syncNotice}
          </div>
        )}
      </div>

      {/* Promos Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {promos.map((promo) => {
          const isBannerActive = promo.isActive && promo.showInBanner !== false;

          return (
            <div
              key={promo.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                promo.isActive ? 'border-orange-100' : 'border-gray-200 opacity-75 bg-gray-50/50'
              }`}
            >
              {/* Live Preview Card As Rendered In Customer Portal */}
              <div
                className={`rounded-2xl p-4 bg-gradient-to-r ${promo.color || 'from-amber-500 to-orange-500'} text-white shadow-xs relative overflow-hidden`}
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {promo.tag || 'Promo Spesial'}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    {renderIcon(promo.iconType || promo.discountType)}
                  </div>
                </div>

                <h4 className="font-extrabold text-sm sm:text-base leading-tight mb-1 truncate">
                  {promo.title}
                </h4>
                <p className="text-white/90 text-xs font-medium line-clamp-2">
                  {promo.subtitle || promo.desc}
                </p>

                {promo.code && (
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wide">
                    <span>KODE:</span>
                    <span className="underline">{promo.code}</span>
                  </div>
                )}
              </div>

              {/* Promo Details Info */}
              <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Tipe Potongan:</span>
                  <span className="font-bold text-gray-800">
                    {promo.discountType === 'percentage'
                      ? `Diskon ${promo.discountValue}% (Maks. ${formatRupiah(promo.maxDiscount)})`
                      : promo.discountType === 'shipping'
                      ? 'Gratis Ongkir (100% Antar)'
                      : `Potongan Langsung ${formatRupiah(promo.discountValue)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Min. Belanja:</span>
                  <span className="font-bold text-gray-800">{formatRupiah(promo.minOrder || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Cakupan Menu:</span>
                  <span className="font-bold text-gray-800">
                    {promo.targetCategory && promo.targetCategory !== 'all'
                      ? DEFAULT_CATEGORIES.find((c) => c.id === promo.targetCategory)?.name || promo.targetCategory
                      : 'Semua Kategori Menu'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Berlaku Sampai:</span>
                  <span className="font-bold text-gray-800">
                    {promo.validUntil || (promo.expiryDate ? `Sampai ${promo.expiryDate}` : 'Setiap Hari')}
                  </span>
                </div>
                {Number(promo.usageLimit) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Batas Kuota:</span>
                    <span className="font-bold text-purple-600">
                      {promo.usageCount || 0} / {promo.usageLimit} Penggunaan
                    </span>
                  </div>
                )}
              </div>

              {/* Controls & Actions */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Status Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleActive(promo.id)}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      promo.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{promo.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>

                  {/* Banner Visibility Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleBanner(promo.id)}
                    disabled={!promo.isActive}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 ${
                      isBannerActive
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title="Tampilkan atau sembunyikan banner di beranda"
                  >
                    {isBannerActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isBannerActive ? 'Tampil Beranda' : 'Sembunyi Beranda'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(promo)}
                    className="p-2 rounded-xl text-gray-500 hover:text-[#FF7A00] hover:bg-orange-50 cursor-pointer transition-colors"
                    title="Edit Promo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus promo "${promo.title}"?`)) {
                        onDeletePromo(promo.id);
                      }
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                    title="Hapus Promo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {promos.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-extrabold text-gray-700 text-base mb-1">Belum Ada Promo</h4>
          <p className="text-xs text-gray-400 mb-4">
            Tambahkan promo baru atau klik tombol reset default untuk memuat promo bawaan.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-[#FF7A00] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Promo Sekarang</span>
          </button>
        </div>
      )}

      {/* Modal Tambah / Edit Promo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl z-10 space-y-4 my-auto max-h-[92vh] overflow-y-auto hide-scrollbar animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FF7A00]" />
                {editingPromoId ? 'Edit Promo & Kupon' : 'Tambah Promo Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Interactive Card Preview */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Pratinjau Banner Pelanggan:
              </p>
              <div
                className={`rounded-2xl p-4 bg-gradient-to-r ${formData.color} text-white shadow-xs relative overflow-hidden`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
                    {formData.tag || 'Promo Spesial'}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    {renderIcon(formData.iconType)}
                  </div>
                </div>

                <h4 className="font-extrabold text-sm sm:text-base leading-tight mb-1 truncate">
                  {formData.title || 'Judul Promo Menarik'}
                </h4>
                <p className="text-white/90 text-xs font-medium line-clamp-2">
                  {formData.subtitle || 'Keterangan promo atau syarat minimal belanja'}
                </p>

                {formData.code && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                    <span>KODE:</span>
                    <span className="underline">{formData.code.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Judul Promo *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Diskon 50% Jajan Puas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:border-[#FF7A00]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Label Tag (Badge Kecil)
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Contoh: Spesial Hari Ini / Flash Sale"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Kode Kupon (Untuk Kasir/Cart)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BELIYUK50"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono font-bold uppercase focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Keterangan Singkat / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Contoh: Min. belanja 40rb • Kode: BELIYUK50"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipe Diskon</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Rupiah (Rp)</option>
                    <option value="shipping">Gratis Ongkir</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {formData.discountType === 'percentage'
                      ? 'Nilai Diskon (%)'
                      : formData.discountType === 'shipping'
                      ? 'Nilai Ongkir (%)'
                      : 'Nilai Potongan (Rp)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    disabled={formData.discountType !== 'percentage'}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold disabled:opacity-50 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cakupan Kategori Menu</label>
                  <select
                    value={formData.targetCategory || 'all'}
                    onChange={(e) => setFormData({ ...formData, targetCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value="all">Semua Kategori (Bebas Menu)</option>
                    {DEFAULT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Teks Masa Berlaku</label>
                  <input
                    type="text"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    placeholder="Contoh: 31 Des 2026 / Tiap Hari"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tanggal Expired (Auto)</label>
                  <input
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Batas Kuota Pemakaian</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit || 0}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="0 = Tanpa Kuota"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              {/* Gradient Color Picker */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Warna Gradien Tema Banner
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: preset.value })}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        formData.color === preset.value
                          ? 'border-[#FF7A00] bg-orange-50/50 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg bg-gradient-to-r ${preset.value} flex-shrink-0 shadow-2xs`} />
                      <span className="text-[11px] font-bold text-gray-700 truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Ikon Banner</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconType: opt.id })}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer text-xs font-bold transition-all ${
                          formData.iconType === opt.id
                            ? 'bg-[#FF7A00] text-white border-[#FF7A00] shadow-xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInBanner}
                    onChange={(e) => setFormData({ ...formData, showInBanner: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                  <span className="font-bold text-gray-700">Tampilkan di Carousel Beranda</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                  <span className="font-bold text-gray-700">Langsung Aktifkan</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
              >
                {editingPromoId ? 'Simpan Perubahan' : 'Tambahkan Promo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
