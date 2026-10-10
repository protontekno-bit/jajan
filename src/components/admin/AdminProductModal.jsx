import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Tag,
  Star,
  UtensilsCrossed,
  Info,
} from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { ProductImageUploader } from './ProductImageUploader.jsx';

// Quick Preset Templates for Variants
const PRESET_TEMPLATES = {
  roti_bakar: {
    label: 'Preset Roti Bakar',
    icon: '🍞',
    description: 'Tingkat Panggang (Radio) + Ekstra Topping (Keju, Susu, Nutella, Crunch)',
    variants: [
      {
        id: 'toast_level',
        name: 'Tingkat Panggang',
        required: true,
        type: 'radio',
        options: [
          { id: 'soft', name: 'Lembut & Empuk Gurih', priceExtra: 0 },
          { id: 'crispy', name: 'Garing & Renyah Crispy', priceExtra: 0 },
        ],
      },
      {
        id: 'extra_toppings',
        name: 'Ekstra Topping (Opsional)',
        required: false,
        type: 'checkbox',
        options: [
          { id: 'extra_keju', name: 'Ekstra Keju Parut Melimpah', priceExtra: 5000 },
          { id: 'extra_susu', name: 'Ekstra Susu Kental Manis', priceExtra: 3000 },
          { id: 'extra_nutella', name: 'Ekstra Nutella Lumer', priceExtra: 7000 },
          { id: 'extra_crunch', name: 'Ekstra ChocoCrunch', priceExtra: 5000 },
        ],
      },
    ],
  },
  healthy_food: {
    label: 'Preset Healthy Food',
    icon: '🥗',
    description: 'Tingkat Panggang + Pilihan Saus + Ekstra Protein (Ayam, Telur, Keju)',
    variants: [
      {
        id: 'toast_level',
        name: 'Tingkat Panggang',
        required: true,
        type: 'radio',
        options: [
          { id: 'soft', name: 'Lembut & Hangat', priceExtra: 0 },
          { id: 'crispy', name: 'Garing & Renyah Crispy', priceExtra: 0 },
        ],
      },
      {
        id: 'sauce_option',
        name: 'Pilihan Saus',
        required: false,
        type: 'radio',
        options: [
          { id: 'special_sauce', name: 'Saus Spesial Gurih Manis', priceExtra: 0 },
          { id: 'spicy_sauce', name: 'Saus Pedas Sedang', priceExtra: 0 },
          { id: 'no_sauce', name: 'Original / Tanpa Saus (Diet Sehat)', priceExtra: 0 },
        ],
      },
      {
        id: 'extra_protein',
        name: 'Ekstra Topping / Protein',
        required: false,
        type: 'checkbox',
        options: [
          { id: 'extra_boiled_egg', name: 'Ekstra Telur Rebus', priceExtra: 5000 },
          { id: 'extra_chicken', name: 'Ekstra Potongan Dada Ayam', priceExtra: 8000 },
          { id: 'extra_cheese', name: 'Ekstra Keju Slice', priceExtra: 4000 },
        ],
      },
    ],
  },
  minuman: {
    label: 'Preset Minuman Dingin',
    icon: '🥤',
    description: 'Level Kemanisan + Level Es Segar',
    variants: [
      {
        id: 'sugar_level',
        name: 'Tingkat Kemanisan',
        required: true,
        type: 'radio',
        options: [
          { id: 'normal_sugar', name: 'Normal Manis Pas', priceExtra: 0 },
          { id: 'less_sugar', name: 'Less Sugar (Sedang)', priceExtra: 0 },
          { id: 'no_sugar', name: 'Tanpa Gula (Tawar)', priceExtra: 0 },
        ],
      },
      {
        id: 'ice_level',
        name: 'Jumlah Es Batu',
        required: true,
        type: 'radio',
        options: [
          { id: 'normal_ice', name: 'Es Normal Segar', priceExtra: 0 },
          { id: 'less_ice', name: 'Sedikit Es', priceExtra: 0 },
          { id: 'no_ice', name: 'Tanpa Es (Dingin Lemari Es)', priceExtra: 0 },
        ],
      },
    ],
  },
};

const BADGE_PRESETS = [
  { label: 'Tanpa Badge', value: '' },
  { label: '🔥 Best Seller', value: '🔥 Best Seller' },
  { label: '⭐ Rekomendasi', value: '⭐ Rekomendasi' },
  { label: '✨ Menu Baru', value: '✨ Menu Baru' },
  { label: '🥗 Diet Sehat', value: '🥗 Diet Sehat' },
  { label: '🏷️ Promo Spesial', value: '🏷️ Promo Spesial' },
  { label: '☕ Favorit Santai', value: '☕ Favorit Santai' },
];

/**
 * Full-Control Product Manager Modal:
 * Allows Store Owner to edit all catalog parameters including variants, toppings,
 * badges, original discount price, ratings, availability, and active display state.
 */
export const AdminProductModal = ({
  isOpen,
  product = null,
  categories = [],
  onClose,
  onSave,
  onDelete = null,
}) => {
  const isEditing = Boolean(product && product.id);

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'variants'

  // Prevent background body scroll when modal is active (eliminates 15px layout shift flicker)
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const defaultCat = useMemo(() => {
    return categories.find((c) => c.id !== 'all')?.id || 'roti_bakar';
  }, [categories]);

  const selectableCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all');
  }, [categories]);

  // Form State initialized from product prop
  const [formData, setFormData] = useState(() => {
    if (product) {
      return {
        id: product.id,
        name: product.name || '',
        category: product.category || defaultCat,
        price: product.price ?? 30000,
        originalPrice: product.originalPrice ?? '',
        badge: product.badge || '',
        rating: product.rating ?? 4.9,
        isAvailable: product.isAvailable !== false,
        isActive: product.isActive !== false,
        img: product.img || '',
        description: product.description || '',
        variants: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : [],
        order: product.order ?? 0,
      };
    }
    return {
      name: '',
      category: defaultCat,
      price: 30000,
      originalPrice: '',
      badge: '',
      rating: 5.0,
      isAvailable: true,
      isActive: true,
      img: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      description: '',
      variants: [],
    };
  });

  // Sync form data seamlessly without remounting DOM
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name || '',
        category: product.category || defaultCat,
        price: product.price ?? 30000,
        originalPrice: product.originalPrice ?? '',
        badge: product.badge || '',
        rating: product.rating ?? 4.9,
        isAvailable: product.isAvailable !== false,
        isActive: product.isActive !== false,
        img: product.img || '',
        description: product.description || '',
        variants: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : [],
        order: product.order ?? 0,
      });
    } else {
      setFormData({
        name: '',
        category: defaultCat,
        price: 30000,
        originalPrice: '',
        badge: '',
        rating: 5.0,
        isAvailable: true,
        isActive: true,
        img: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        description: '',
        variants: [],
      });
    }
    setActiveTab('info');
    setErrorMsg('');
  }, [product, defaultCat]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Form Change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Variant Group Actions
  const handleAddVariantGroup = () => {
    const newGroup = {
      id: `var_${Date.now()}`,
      name: 'Varian Baru',
      required: false,
      type: 'radio',
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Pilihan 1', priceExtra: 0 },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newGroup],
    }));
  };

  const handleApplyPreset = (presetKey) => {
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return;
    if (formData.variants.length > 0) {
      if (!confirm(`Terapkan ${template.label}? Grup varian yang sudah ada akan digabungkan dengan template ini.`)) {
        return;
      }
    }
    const cloned = JSON.parse(JSON.stringify(template.variants));
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, ...cloned],
    }));
  };

  const handleRemoveVariantGroup = (groupIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== groupIndex),
    }));
  };

  const handleUpdateVariantGroup = (groupIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[groupIndex] = { ...updated[groupIndex], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleAddOption = (groupIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      const group = updated[groupIndex];
      const newOpt = {
        id: `opt_${Date.now()}`,
        name: 'Opsi Tambahan',
        priceExtra: 0,
      };
      group.options = [...(group.options || []), newOpt];
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveOption = (groupIndex, optionIndex) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      const group = updated[groupIndex];
      group.options = group.options.filter((_, idx) => idx !== optionIndex);
      return { ...prev, variants: updated };
    });
  };

  const handleUpdateOption = (groupIndex, optionIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      const group = updated[groupIndex];
      const opt = { ...group.options[optionIndex], [field]: value };
      group.options = group.options.map((o, idx) => (idx === optionIndex ? opt : o));
      return { ...prev, variants: updated };
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Nama menu wajib diisi!');
      setActiveTab('info');
      return;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 1000) {
      setErrorMsg('Harga menu harus berupa angka minimal Rp 1.000!');
      setActiveTab('info');
      return;
    }

    const origPriceNum = formData.originalPrice ? Number(formData.originalPrice) : null;
    if (origPriceNum && origPriceNum < priceNum) {
      setErrorMsg('Harga coret / normal harus lebih besar dari harga jual diskon!');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: priceNum,
        originalPrice: origPriceNum,
        rating: Number(formData.rating) || 4.9,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVariantOptions = useMemo(
    () => formData.variants.reduce((acc, v) => acc + (v.options?.length || 0), 0),
    [formData.variants]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl z-10 overflow-hidden transition-all duration-150 ease-out">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF7A00] text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-gray-800">
                {isEditing ? 'Edit Detail Menu' : 'Tambah Menu Baru'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Semua menu yang tampil di katalog dikontrol langsung melalui form ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#FF7A00] text-[#FF7A00]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>1. Detail & Harga Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-2.5 px-3 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'variants'
                ? 'border-[#FF7A00] text-[#FF7A00]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>2. Varian & Ekstra Topping</span>
            {formData.variants.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 text-[#FF7A00] font-extrabold">
                {formData.variants.length} ({totalVariantOptions} opsi)
              </span>
            )}
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: INFO & PRICING */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="font-extrabold text-gray-700 block mb-1">
                  Nama Menu Makanan / Minuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Contoh: Roti Bakar Nutella Keju Lumer"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-800 focus:bg-white focus:border-[#FF7A00] focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Category & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-gray-700 block mb-1">
                    Kategori Menu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-xs text-gray-800 focus:bg-white focus:border-[#FF7A00] focus:outline-none transition-all cursor-pointer"
                  >
                    {selectableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-gray-700 block mb-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#FFC107] fill-[#FFC107]" />
                    <span>Rating Pelanggan (1.0 - 5.0)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={formData.rating}
                    onChange={(e) => handleChange('rating', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-xs text-gray-800 focus:bg-white focus:border-[#FF7A00] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-gray-800 block mb-1">
                      Harga Jual (IDR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-white border border-gray-200 font-black text-sm text-[#FF7A00] focus:border-[#FF7A00] focus:outline-none"
                        required
                      />
                    </div>
                    <p className="text-[11px] font-bold text-orange-600 mt-1">
                      Format: {formatRupiah(Number(formData.price) || 0)}
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Harga Normal / Coret (Opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="Contoh: 35000"
                        value={formData.originalPrice}
                        onChange={(e) => handleChange('originalPrice', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-white border border-gray-200 font-bold text-xs text-gray-600 focus:border-[#FF7A00] focus:outline-none"
                      />
                    </div>
                    {formData.originalPrice && Number(formData.originalPrice) > Number(formData.price) && (
                      <p className="text-[11px] font-extrabold text-emerald-600 mt-1">
                        ✓ Diskon Hemat {formatRupiah(Number(formData.originalPrice) - Number(formData.price))} (
                        {Math.round(
                          ((Number(formData.originalPrice) - Number(formData.price)) /
                            Number(formData.originalPrice)) *
                            100
                        )}
                        %)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge & Highlight Label */}
              <div>
                <label className="font-extrabold text-gray-700 block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#FF7A00]" />
                  <span>Badge Label Khusus (Pilihan Cepat)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {BADGE_PRESETS.map((bp) => (
                    <button
                      key={bp.label}
                      type="button"
                      onClick={() => handleChange('badge', bp.value)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        formData.badge === bp.value
                          ? 'bg-[#FF7A00] text-white shadow-2xs font-extrabold scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => handleChange('badge', e.target.value)}
                  placeholder="Atau ketik badge custom (contoh: 🌶️ Pedas Nampol)"
                  className="w-full px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                />
              </div>

              {/* Visibility & Stock Availability Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => handleChange('isAvailable', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">
                      {formData.isAvailable ? '🟢 Stok Ready' : '🔴 Stok Habis'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Pelanggan tetap bisa melihat menu saat stok habis
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF7A00] focus:ring-[#FF7A00] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">
                      {formData.isActive ? '👁️ Tampilkan di Katalog' : '🔒 Sembunyikan (Draft)'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Jika dimatikan, menu tidak akan muncul di katalog pembeli
                    </span>
                  </div>
                </label>
              </div>

              {/* Image Uploader */}
              <ProductImageUploader
                value={formData.img}
                onChange={(newImg) => handleChange('img', newImg)}
                label="Foto Produk Menu"
              />

              {/* Description */}
              <div>
                <label className="font-extrabold text-gray-700 block mb-1">
                  Deskripsi Menu & Komposisi
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:bg-white focus:border-[#FF7A00] focus:outline-none resize-none"
                  placeholder="Keterangan bahan baku, sensasi rasa, atau panduan porsi"
                />
              </div>
            </div>
          )}

          {/* TAB 2: VARIANTS & TOPPINGS */}
          {activeTab === 'variants' && (
            <div className="space-y-4 text-xs">
              {/* Preset Buttons Header */}
              <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#FF7A00]" />
                  <h4 className="font-black text-gray-800 text-xs">
                    Terapkan Template Varian 1-Klik:
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRESET_TEMPLATES).map(([key, tpl]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100/60 border border-orange-200 font-bold text-gray-700 hover:text-[#FF7A00] text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <span>{tpl.icon}</span>
                      <span>+ {tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {formData.variants.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF7A00] flex items-center justify-center mx-auto">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800">
                      Belum Ada Varian atau Topping
                    </h4>
                    <p className="text-gray-500 text-xs max-w-sm mx-auto mt-1">
                      Menu ini akan dijual dengan harga tunggal tanpa opsi kustomisasi. Anda bisa menambahkan opsi varian (tingkat panggang, saus, atau topping ekstra).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantGroup}
                    className="px-4 py-2 rounded-full bg-[#FF7A00] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Grup Varian Manual</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.variants.map((group, gIdx) => (
                    <div
                      key={group.id || gIdx}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3 relative group/box hover:border-orange-300 transition-colors"
                    >
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF7A00] font-black text-xs flex items-center justify-center">
                            {gIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) =>
                              handleUpdateVariantGroup(gIdx, 'name', e.target.value)
                            }
                            placeholder="Nama Grup Varian (contoh: Pilihan Saus)"
                            className="font-extrabold text-sm text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[#FF7A00] focus:outline-none flex-1 py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={group.type}
                            onChange={(e) =>
                              handleUpdateVariantGroup(gIdx, 'type', e.target.value)
                            }
                            className="px-2.5 py-1 rounded-xl bg-gray-100 font-bold text-xs text-gray-700 border border-transparent focus:border-[#FF7A00] focus:outline-none cursor-pointer"
                          >
                            <option value="radio">Pilihan Tunggal (Radio)</option>
                            <option value="checkbox">Pilihan Banyak (Checkbox Topping)</option>
                          </select>

                          <label className="flex items-center gap-1 text-[11px] font-bold text-gray-600 cursor-pointer bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) =>
                                handleUpdateVariantGroup(gIdx, 'required', e.target.checked)
                              }
                              className="rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                            />
                            <span>Wajib</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariantGroup(gIdx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Grup Varian Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2 pl-2 sm:pl-4">
                        {(group.options || []).map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            className="flex items-center gap-2 bg-gray-50/70 p-2 rounded-xl border border-gray-100"
                          >
                            <span className="text-gray-400 text-xs font-mono">•</span>
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) =>
                                handleUpdateOption(gIdx, oIdx, 'name', e.target.value)
                              }
                              placeholder="Nama Opsi (contoh: Ekstra Keju)"
                              className="flex-1 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#FF7A00]"
                            />

                            <div className="flex items-center gap-1 w-32 sm:w-36">
                              <span className="text-[10px] font-bold text-gray-500">+Rp</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={opt.priceExtra}
                                onChange={(e) =>
                                  handleUpdateOption(
                                    gIdx,
                                    oIdx,
                                    'priceExtra',
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full bg-white px-2 py-1.5 rounded-lg border border-gray-200 font-bold text-xs text-orange-600 focus:outline-none focus:border-[#FF7A00]"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveOption(gIdx, oIdx)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 cursor-pointer"
                              title="Hapus opsi ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddOption(gIdx)}
                          className="mt-1 px-3 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF7A00] font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Opsi Pilihan</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddVariantGroup}
                      className="w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FF7A00] text-gray-600 hover:text-[#FF7A00] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Grup Varian Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(formData)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                title="Hapus menu ini dari database katalog"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Menu</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full bg-[#FF7A00] text-white font-bold text-xs shadow-md hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Menyimpan ke Cloud...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditing ? 'Simpan Perubahan Menu' : 'Simpan Menu Baru'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
