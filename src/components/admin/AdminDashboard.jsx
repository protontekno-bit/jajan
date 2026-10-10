import React, { useState } from 'react';
import {
  Store,
  SlidersHorizontal,
  Plus,
  Check,
  Save,
  RotateCcw,
  MessageCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
  Link as LinkIcon,
  Copy,
  Lock,
  Edit2,
  Trash2,
  Phone,
  Clock,
  MapPin,
  Truck,
  Cloud,
  Database,
  UploadCloud,
  ClipboardList,
  CheckCircle2,
  Clock3,
  DollarSign,
  ShoppingBag,
  Tag,
  ExternalLink,
  Sparkles,
  Printer,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';
import { AdminPromoManager } from './AdminPromoManager.jsx';
import { AdminCategoryManager } from './AdminCategoryManager.jsx';
import { AdminHeroSlideManager } from './AdminHeroSlideManager.jsx';
import { AdminProductModal } from './AdminProductModal.jsx';
import { ThermalReceiptModal } from './ThermalReceiptModal.jsx';
import { playNewOrderChime, unlockAudio } from '../../utils/audioAlert.js';
import {
  saveFirebaseConfig,
  getStoredFirebaseConfig,
  subscribeToCloudOrders,
  updateOrderStatusInCloud,
  deleteOrderFromCloud,
  clearOrdersFromCloud,
} from '../../services/firebase.js';
import { APP_CONFIG } from '../../config/constants.js';

/**
 * Store Owner Admin Dashboard component.
 * Features dedicated URL support, PIN protection, and total control over customer portal.
 * @param {Object} props
 * @param {Array} props.products
 * @param {Function} props.onToggleAvailability
 * @param {Function} props.onUpdateProduct
 * @param {Function} props.onAddProduct
 * @param {Function} props.onResetProducts
 * @param {Object} props.settings
 * @param {Function} props.onUpdateSettings
 * @param {Function} props.onBackToCustomerPortal
 * @param {Array} props.categories
 */
export const AdminDashboard = ({
  products = [],
  onToggleAvailability,
  onToggleProductActive,
  onMoveProduct,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onResetProducts,
  isCloudActive = false,
  onSyncToCloud,
  settings,
  onUpdateSettings,
  onBackToCustomerPortal,
  onLogout,
  adminUser,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories,
  onSyncCategoriesToCloud,
  onMoveCategory,
  onReorderCategoryToPosition,
  promos = [],
  onTogglePromoActive,
  onTogglePromoBanner,
  onAddPromo,
  onUpdatePromo,
  onDeletePromo,
  onResetPromos,
  onSyncPromosToCloud,
  heroSlides = [],
  onAddSlide,
  onUpdateSlide,
  onDeleteSlide,
  onToggleSlideActive,
  onMoveSlide,
  onResetSlides,
  onSyncSlidesToCloud,
}) => {
  const [activeTab, setActiveTab] = useState('orders'); // default to 'orders' to monitor incoming transactions
  const [searchMenu, setSearchMenu] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'ready' | 'empty' | 'active' | 'hidden'
  const [menuToast, setMenuToast] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Centralized Orders State (Pure Cloud Firestore)
  const [ordersList, setOrdersList] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.orders);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'new' | 'processing' | 'done' | 'cancel'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Thermal Receipt POS Print State
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Audio Chime Alert State for Kitchen & Cashier
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const prevNewOrderCountRef = React.useRef(0);
  const isInitialMountRef = React.useRef(true);

  // Real-time listener for incoming customer orders from Cloud Firestore
  React.useEffect(() => {
    const unsubscribe = subscribeToCloudOrders(
      (cloudOrders) => {
        if (cloudOrders && Array.isArray(cloudOrders)) {
          setOrdersList(cloudOrders);
        }
      },
      (err) => {
        console.warn('Orders listener fallback to local:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Monitor incoming new orders and sound kitchen chime alert
  React.useEffect(() => {
    const currentNewOrders = ordersList.filter(
      (o) => o.status?.includes('Baru') || !o.status
    ).length;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevNewOrderCountRef.current = currentNewOrders;
      return;
    }

    if (currentNewOrders > prevNewOrderCountRef.current && isSoundEnabled) {
      playNewOrderChime();
    }
    prevNewOrderCountRef.current = currentNewOrders;
  }, [ordersList, isSoundEnabled]);

  const handleTestSound = () => {
    unlockAudio();
    playNewOrderChime();
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // 1. Optimistic local update
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    // 2. Cloud Firestore update
    await updateOrderStatusInCloud(orderId, newStatus);
  };

  const handleDeleteSingleOrder = async (orderId) => {
    if (!window.confirm(`Hapus pesanan #${orderId} secara permanen dari daftar?`)) {
      return;
    }
    const updated = ordersList.filter((o) => o.id !== orderId);
    setOrdersList(updated);
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.orders, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update local storage:', e);
    }
    await deleteOrderFromCloud(orderId);
  };

  const handleClearAllTestOrders = async () => {
    const count = ordersList.length;
    if (
      !window.confirm(
        `PERINGATAN OPERASIONAL:\n\nApakah Anda yakin ingin menghapus SELURUH ${count} pesanan yang tercatat?\n\nGunakan fitur ini untuk membersihkan riwayat pesanan uji coba/mock sebelum toko beroperasi secara nyata.`
      )
    ) {
      return;
    }

    const idsToDelete = ordersList.map((o) => o.id);
    setOrdersList([]);
    try {
      localStorage.removeItem(APP_CONFIG.storageKeys.orders);
      localStorage.removeItem('beliyuk_orders_v1');
    } catch (e) {
      console.warn('Failed to clear local orders:', e);
    }
    await clearOrdersFromCloud(idsToDelete);
  };

  // Executive Revenue Metrics (KPIs)
  const validOrders = ordersList.filter((o) => !o.status?.includes('Batal'));
  const totalOmset = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const newOrdersCount = ordersList.filter((o) => o.status?.includes('Baru') || !o.status).length;
  const processingCount = ordersList.filter((o) => o.status?.includes('Disiapkan') || o.status?.includes('Diantar')).length;
  const completedCount = ordersList.filter((o) => o.status?.includes('Selesai') || o.status?.includes('Lunas')).length;

  // Firebase Config State
  const [firebaseConfigInput, setFirebaseConfigInput] = useState(() => {
    const current = getStoredFirebaseConfig();
    return current ? JSON.stringify(current, null, 2) : '';
  });
  const [cloudMsg, setCloudMsg] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Full Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);

  // Local Form state for settings
  const [formSettings, setFormSettings] = useState({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const adminUrl = `${window.location.origin}/admin`;

  const handleCopyAdminLink = () => {
    navigator.clipboard?.writeText(adminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleStartEditPrice = (product) => {
    setEditingPriceId(product.id);
    setNewPriceValue(product.price.toString());
  };

  const handleSavePrice = async (product) => {
    const parsed = parseInt(newPriceValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      try {
        await onUpdateProduct({ ...product, price: parsed });
        setMenuToast(`✅ Harga "${product.name}" berhasil diperbarui ke ${formatRupiah(parsed)} di Cloud!`);
        setTimeout(() => setMenuToast(null), 2500);
      } catch (err) {
        alert(`Gagal memperbarui harga ke database: ${err.message || 'Akses ditolak / offline'}`);
      }
    }
    setEditingPriceId(null);
  };

  const handleRequestDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      if (onDeleteProduct) {
        const idToDelete = productToDelete.docId || productToDelete.id;
        await onDeleteProduct(idToDelete);
        setMenuToast(`🗑️ Menu "${productToDelete.name}" berhasil dihapus permanen dari Cloud Firestore!`);
        setTimeout(() => setMenuToast(null), 3500);
      }
      setProductToDelete(null);
    } catch (err) {
      alert(`Gagal menghapus menu dari Cloud Firestore: ${err.message || 'Akses ditolak'}`);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSaveCloudConfig = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(firebaseConfigInput.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        setCloudMsg('❌ Konfigurasi harus memiliki apiKey dan projectId!');
        return;
      }
      const ok = saveFirebaseConfig(parsed);
      if (ok) {
        setCloudMsg('✅ Konfigurasi Firebase berhasil disimpan! Refresh halaman untuk mengaktifkan sinkronisasi.');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setCloudMsg('❌ Gagal menyimpan konfigurasi.');
      }
    } catch {
      setCloudMsg('❌ Format JSON tidak valid! Pastikan format JSON benar.');
    }
  };

  const handleDisconnectCloud = () => {
    if (confirm('Putuskan koneksi Firebase dan kembali ke mode penyimpanan lokal?')) {
      saveFirebaseConfig(null);
      setFirebaseConfigInput('');
      setCloudMsg('ℹ️ Firebase diputuskan. Aplikasi kembali ke mode penyimpanan lokal.');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleSyncAllToCloud = async () => {
    if (!onSyncToCloud) return;
    setIsSyncingCloud(true);
    setCloudMsg('⏳ Sedang mengunggah semua menu ke Cloud Firestore...');
    try {
      await onSyncToCloud();
      setCloudMsg(`✅ Sukses! ${products.length} menu berhasil diunggah ke Cloud Firestore.`);
    } catch (err) {
      setCloudMsg(`❌ Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchMenu.trim() ||
      p.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchMenu.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    let matchesStatus = true;
    if (selectedStatusFilter === 'ready') matchesStatus = p.isAvailable !== false;
    else if (selectedStatusFilter === 'empty') matchesStatus = p.isAvailable === false;
    else if (selectedStatusFilter === 'active') matchesStatus = p.isActive !== false;
    else if (selectedStatusFilter === 'hidden') matchesStatus = p.isActive === false;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="py-4 animate-in fade-in duration-200">
      {/* Dedicated URL Banner Bar */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/80 rounded-2xl p-3 sm:p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF7A00] text-white flex items-center justify-center flex-shrink-0">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">
              Link Khusus Dashboard Admin:{' '}
              <span className="font-mono text-[#FF7A00] select-all">{adminUrl}</span>
            </p>
            <p className="text-[11px] text-gray-500">
              Simpan link ini di bookmark peramban Anda untuk akses instan ke panel admin.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyAdminLink}
          className="px-3.5 py-1.5 rounded-full bg-white text-[#FF7A00] hover:bg-orange-50 border border-orange-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs btn-bounce cursor-pointer flex-shrink-0"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Link Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Link</span>
            </>
          )}
        </button>
      </div>

      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-orange-100 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-orange-100 text-[#FF7A00] px-2.5 py-0.5 rounded-full">
              Mode Pemilik Toko
            </span>
            <span className="text-xs text-gray-400 font-medium">Mission Control</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mt-1">
            Dashboard Kontrol Katalog & Toko
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kontrol stok menu, edit harga, sesuaikan varian, dan kelola WhatsApp kasir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {adminUser && adminUser.email && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-[#FF7A00] font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{adminUser.email}</span>
            </span>
          )}

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-full text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors btn-bounce cursor-pointer"
            title="Keluar dari Sesi Admin"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={onBackToCustomerPortal}
            className="px-4 py-2 rounded-full bg-[#2D3748] text-white hover:bg-black font-bold text-xs flex items-center gap-1.5 shadow-sm btn-bounce cursor-pointer transition-all"
          >
            <span>&larr; Web Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-gray-200/80 pb-3 mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pesanan Masuk & Omset ({ordersList.length})</span>
          {newOrdersCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {newOrdersCount} Baru
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Kelola Menu & Stok ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Pengaturan Toko, Lokasi & WA</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'promos'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kelola Promo & Kupon ({promos.length})</span>
          {promos.filter((p) => p.isActive).length > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {promos.filter((p) => p.isActive).length} Aktif
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('hero_slides')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'hero_slides'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Slide Banner Hero ({heroSlides.length})</span>
          {heroSlides.filter((s) => s.isActive !== false).length > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {heroSlides.filter((s) => s.isActive !== false).length} Aktif
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Pratinjau Pesan WA</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'cloud'
              ? 'bg-[#FF7A00] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud Firebase ☁️</span>
          {isCloudActive ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* TAB 0: REKAP PESANAN MASUK & OMSET PENJUALAN (CENTRALIZED CLOUD LEDGER) */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Omset</p>
                <h4 className="text-base sm:text-xl font-black text-gray-800 leading-tight">
                  {formatRupiah(totalOmset)}
                </h4>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Dari transaksi aktif</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pesanan</p>
                <h4 className="text-base sm:text-xl font-black text-gray-800 leading-tight">
                  {ordersList.length} Transaksi
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Cloud database</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Perlu Diproses</p>
                <h4 className="text-base sm:text-xl font-black text-gray-800 leading-tight">
                  {newOrdersCount + processingCount} Pesanan
                </h4>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  {newOrdersCount} Baru • {processingCount} Proses
                </p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pesanan Selesai</p>
                <h4 className="text-base sm:text-xl font-black text-gray-800 leading-tight">
                  {completedCount} Selesai
                </h4>
                <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Lunas & diterima</p>
              </div>
            </div>
          </div>

          {/* Orders Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              placeholder="Cari ID pesanan, nama pemesan, no HP..."
              className="px-4 py-2.5 rounded-full bg-white border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#FF7A00] flex-1 max-w-sm"
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                {[
                  { id: 'all', label: `Semua (${ordersList.length})` },
                  { id: 'new', label: `Baru (${newOrdersCount})` },
                  { id: 'processing', label: `Diproses (${processingCount})` },
                  { id: 'done', label: `Selesai (${completedCount})` },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setOrderStatusFilter(filter.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      orderStatusFilter === filter.id
                        ? 'bg-[#2D3748] text-white shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Sound Notification Alert Controls */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setIsSoundEnabled((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSoundEnabled
                      ? 'bg-emerald-600 text-white shadow-2xs font-black'
                      : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'
                  }`}
                  title={isSoundEnabled ? 'Suara dering aktif' : 'Suara dering dibisukan'}
                >
                  {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isSoundEnabled ? 'Dering: Aktif' : 'Dering: Bisu'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-2.5 py-1.5 rounded-full bg-white text-gray-700 hover:bg-orange-50 text-[11px] font-bold border border-gray-200 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Tes nada bel restoran kasir"
                >
                  <Bell className="w-3 h-3 text-[#FF7A00]" />
                  <span>Tes Suara</span>
                </button>
              </div>

              {ordersList.length > 0 && (
                <button
                  onClick={handleClearAllTestOrders}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  title="Bersihkan semua data pesanan uji coba untuk persiapan operasional toko nyata"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Pesanan Uji Coba</span>
                </button>
              )}
            </div>
          </div>

          {/* New Orders Visual Pulsing Banner */}
          {newOrdersCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black flex-shrink-0 animate-bounce">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-red-800">
                    Ada {newOrdersCount} Pesanan Baru Masuk!
                  </h4>
                  <p className="text-[11px] text-red-600 font-medium">
                    Segera ubah status pesanan menjadi "Disiapkan" agar koki segera memproses di dapur.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('new')}
                className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs self-start sm:self-auto"
              >
                Tampilkan Pesanan Baru ({newOrdersCount})
              </button>
            </div>
          )}

          {/* Real-time Order Cards List */}
          {ordersList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
              <div className="w-16 h-16 bg-orange-50 text-[#FF7A00] rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-800">Belum Ada Pesanan Masuk</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Setiap kali pelanggan melakukan checkout di katalog, pesanan akan otomatis tercatat di sini secara real-time dan terkirim ke WhatsApp toko.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordersList
                .filter((order) => {
                  if (orderStatusFilter === 'new' && !order.status?.includes('Baru')) return false;
                  if (
                    orderStatusFilter === 'processing' &&
                    !order.status?.includes('Disiapkan') &&
                    !order.status?.includes('Diantar')
                  )
                    return false;
                  if (
                    orderStatusFilter === 'done' &&
                    !order.status?.includes('Selesai') &&
                    !order.status?.includes('Lunas')
                  )
                    return false;

                  if (orderSearchQuery.trim()) {
                    const q = orderSearchQuery.toLowerCase();
                    const matchId = order.id?.toLowerCase().includes(q);
                    const matchName = order.customerName?.toLowerCase().includes(q);
                    const matchPhone = order.customerPhone?.toLowerCase().includes(q);
                    return matchId || matchName || matchPhone;
                  }
                  return true;
                })
                .map((order) => {
                  const isNew = order.status?.includes('Baru') || !order.status;
                  const isProcessing = order.status?.includes('Disiapkan') || order.status?.includes('Diantar');
                  const isDone = order.status?.includes('Selesai') || order.status?.includes('Lunas');

                  const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                  const waCustomerUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
                    : null;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs hover:border-orange-200 transition-all space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sm text-[#FF7A00] bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-100">
                            #{order.id}
                          </span>
                          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : order.date || 'Baru Saja'}</span>
                          </span>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isNew
                                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                                : isProcessing
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {order.status || 'Pesanan Baru 🔔'}
                          </span>

                          {/* Tombol Cetak Struk POS Thermal */}
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            title="Cetak Struk Thermal (58mm/80mm) untuk Dapur & Kurir"
                            className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF7A00] border border-orange-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Struk</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSingleOrder(order.id)}
                            title="Hapus pesanan ini secara permanen"
                            className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Details & Method */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <p className="text-gray-400 font-bold uppercase text-[10px]">Data Pemesan</p>
                          <p className="font-extrabold text-sm text-gray-800">
                            {order.customerName || 'Pelanggan'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">{order.customerPhone || '-'}</span>
                            {waCustomerUrl && (
                              <a
                                href={waCustomerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Chat WA</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-gray-400 font-bold uppercase text-[10px]">Pengiriman & Catatan</p>
                          <p className="font-bold text-gray-700 flex items-center gap-1">
                            {order.orderType === 'delivery' ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-blue-500" />
                                <span>🛵 Antar ke Alamat (Sangatta)</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3.5 h-3.5 text-orange-500" />
                                <span>🏬 Ambil Sendiri di Toko</span>
                              </>
                            )}
                          </p>
                          {order.address && (
                            <p className="text-gray-500 text-[11px] leading-relaxed">
                              📍 {order.address}
                            </p>
                          )}
                          {order.gpsCoordinates?.mapsUrl && (
                            <div className="pt-0.5">
                              <a
                                href={order.gpsCoordinates.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 transition-colors"
                              >
                                <MapPin className="w-3 h-3 text-blue-600" />
                                <span>Buka Titik GPS (Google Maps) &rarr;</span>
                              </a>
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-orange-800 bg-orange-50/70 p-2 rounded-xl text-[11px] border border-orange-100 font-medium">
                              💬 Catatan: "{order.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Items Ordered Breakdown */}
                      <div className="bg-gray-50/70 rounded-2xl p-3.5 space-y-2 border border-gray-100 text-xs">
                        <p className="font-extrabold text-[11px] text-gray-500 uppercase tracking-wider">
                          Daftar Menu Roti Bakar:
                        </p>
                        <div className="divide-y divide-gray-200/50">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between items-start gap-2">
                              <div>
                                <span className="font-extrabold text-gray-800">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                  <div className="text-[11px] text-gray-500 mt-0.5 pl-2 border-l-2 border-orange-200">
                                    {Object.entries(item.selectedVariants).map(([vName, opt]) => (
                                      <span key={vName} className="block">
                                        • {vName}: {opt.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.selectedToppings && item.selectedToppings.length > 0 && (
                                  <div className="text-[11px] text-orange-600 pl-2 border-l-2 border-orange-200">
                                    + Topping: {item.selectedToppings.map((t) => t.name).join(', ')}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-gray-700 whitespace-nowrap">
                                {formatRupiah((item.price || 0) * (item.quantity || 1))}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal & Total */}
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-medium text-gray-500">
                          <span>Subtotal Menu: {formatRupiah(order.subtotal || order.total)}</span>
                          <span>Ongkir: {order.deliveryFee === 0 ? 'GRATIS' : formatRupiah(order.deliveryFee || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-sm font-black text-gray-800">
                          <span>Total Pembayaran:</span>
                          <span className="text-[#FF7A00] text-base">{formatRupiah(order.total || 0)}</span>
                        </div>
                      </div>

                      {/* Status Action Toolbar */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-400">Ubah Status Pesanan:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Pesanan Baru 🔔')}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                          >
                            🔔 Baru
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Sedang Disiapkan 🍳')}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                          >
                            🍳 Sedang Disiapkan
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Sedang Diantar 🛵')}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                          >
                            🛵 Sedang Diantar
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Selesai & Lunas ✅')}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            ✅ Selesai & Lunas
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Dibatalkan ❌')}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          >
                            ❌ Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: KELOLA MENU & STOK */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Kelola Kategori Menu Dinamis */}
          <AdminCategoryManager
            categories={categories}
            products={products}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            onResetCategories={onResetCategories}
            isCloudActive={isCloudActive}
            onSyncCategoriesToCloud={onSyncCategoriesToCloud}
            onMoveCategory={onMoveCategory}
            onReorderCategoryToPosition={onReorderCategoryToPosition}
          />

          {/* Toast Notifikasi Feedback Menu */}
          {menuToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
              <span>{menuToast}</span>
              <button
                type="button"
                onClick={() => setMenuToast(null)}
                className="text-emerald-500 hover:text-emerald-700 text-base font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Filter Kategori Menu Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-gray-800 text-white shadow-xs font-extrabold'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Semua Menu ({products.length})
            </button>
            {categories
              .filter((c) => c.id !== 'all')
              .map((c) => {
                const count = products.filter((p) => p.category === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                      selectedCategoryFilter === c.id
                        ? 'bg-[#FF7A00] text-white shadow-xs font-extrabold'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
          </div>

          {/* Filter Status & Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchMenu}
                  onChange={(e) => setSearchMenu(e.target.value)}
                  placeholder="Cari nama menu / deskripsi..."
                  className="w-full pl-3.5 pr-8 py-2 rounded-full bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#FF7A00]"
                />
                {searchMenu && (
                  <button
                    type="button"
                    onClick={() => setSearchMenu('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'ready', label: '🟢 Ready' },
                  { id: 'empty', label: '🔴 Habis' },
                  { id: 'active', label: '👁️ Tampil' },
                  { id: 'hidden', label: '🔒 Sembunyi' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatusFilter === st.id
                        ? 'bg-white text-[#FF7A00] shadow-2xs font-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm btn-bounce cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah Menu Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Kembalikan semua menu ke setelan default?')) {
                    onResetProducts();
                  }
                }}
                className="p-2 rounded-full bg-white text-gray-400 hover:text-gray-700 border border-gray-200 transition-colors btn-bounce cursor-pointer"
                title="Reset Menu ke Awal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Items Table / Cards */}
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xs space-y-2">
              <p className="text-gray-500 text-xs font-bold">
                Tidak ada menu yang sesuai dengan filter atau kata kunci "{searchMenu}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchMenu('');
                  setSelectedCategoryFilter('all');
                  setSelectedStatusFilter('all');
                }}
                className="text-xs font-bold text-[#FF7A00] hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {filtered.map((product, pIdx) => {
                const isAvailable = product.isAvailable !== false;
                const isVisible = product.isActive !== false;
                const hasVariants = product.variants && product.variants.length > 0;
                const categoryObj = categories.find((c) => c.id === product.category);

                return (
                  <div
                    key={product.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-orange-50/20 transition-colors ${
                      !isVisible ? 'bg-gray-50/70 opacity-80' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Order Position Up/Down Controls */}
                      <div className="flex flex-col items-center justify-center gap-0.5 pr-1.5 border-r border-gray-100 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onMoveProduct && onMoveProduct(product.id, 'up')}
                          disabled={pIdx === 0}
                          className="p-0.5 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                          title="Geser menu naik"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-black font-mono text-gray-400">
                          #{pIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onMoveProduct && onMoveProduct(product.id, 'down')}
                          disabled={pIdx === filtered.length - 1}
                          className="p-0.5 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                          title="Geser menu turun"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <img
                        src={product.img}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500';
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-2xl flex-shrink-0 border border-gray-100"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-800 truncate">
                            {product.name}
                          </h4>

                          {/* Highlight Badge */}
                          {product.badge && (
                            <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-orange-100 text-[#FF7A00]">
                              {product.badge}
                            </span>
                          )}

                          {/* Category Badge */}
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-gray-100 text-gray-600">
                            {categoryObj ? `${categoryObj.icon} ${categoryObj.name}` : product.category}
                          </span>

                          {/* Visibility Status Badge */}
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isVisible ? '👁️ Tampil' : '🔒 Sembunyi'}
                          </span>
                        </div>

                        {/* Variants summary */}
                        {hasVariants ? (
                          <p className="text-[11px] text-orange-600 font-bold mt-0.5 flex items-center gap-1">
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>
                              {product.variants.length} grup varian (
                              {product.variants.map((v) => v.name).join(', ')})
                            </span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 mt-0.5">Tanpa varian tambahan</p>
                        )}

                        {/* Price & Original Price with Inline Quick Editor */}
                        <div className="mt-1 flex items-center gap-2">
                          {editingPriceId === product.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-500">Rp</span>
                              <input
                                type="number"
                                value={newPriceValue}
                                onChange={(e) => setNewPriceValue(e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-[#FF7A00] text-xs font-bold"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSavePrice(product)}
                                className="p-1 rounded bg-[#FF7A00] text-white text-xs font-bold cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingPriceId(null)}
                                className="p-1 text-xs text-gray-400 cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-[#FF7A00]">
                                {formatRupiah(product.price)}
                              </span>
                              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                                <span className="text-[11px] text-gray-400 line-through font-semibold">
                                  {formatRupiah(Number(product.originalPrice))}
                                </span>
                              )}
                              <button
                                onClick={() => handleStartEditPrice(product)}
                                className="p-1 text-gray-300 hover:text-gray-600 cursor-pointer"
                                title="Ubah harga cepat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock Availability Toggle Switch & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 flex-wrap">
                      {/* Stock Ready / Habis */}
                      <button
                        type="button"
                        onClick={() => onToggleAvailability(product.id)}
                        className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={isAvailable ? 'Tandai menu habis stok' : 'Tandai menu kembali tersedia'}
                      >
                        {isAvailable ? 'Tandai Habis' : 'Tandai Ready'}
                      </button>

                      {/* Visibility Toggle (Tampil / Sembunyi) */}
                      <button
                        type="button"
                        onClick={() => onToggleProductActive && onToggleProductActive(product.id)}
                        className={`px-2.5 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                          isVisible
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-orange-50 text-[#FF7A00] border border-orange-200'
                        }`}
                        title={isVisible ? 'Sembunyikan menu dari katalog pembeli' : 'Tampilkan menu di katalog pembeli'}
                      >
                        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isVisible ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>

                      {/* Full Edit Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...product })}
                        className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit Nama, Harga, Varian, Foto & Deskripsi Lengkap"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Detail</span>
                      </button>

                      {/* Delete Menu */}
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteProduct(product)}
                        className="p-1.5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer"
                        title="Hapus Menu dari Katalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENGATURAN TOKO & WHATSAPP */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs max-w-2xl space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-black text-base text-gray-800">
                Konfigurasi Toko, Lokasi & WhatsApp Kasir
              </h3>
              <p className="text-xs text-gray-400">
                Semua pesanan pelanggan akan dikirim ke nomor WhatsApp dan lokasi berikut
              </p>
            </div>
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Tersimpan!
              </span>
            )}
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#25D366]" />
                Nomor WhatsApp Kasir / Toko (Format Internasional)
              </label>
              <input
                type="text"
                value={formSettings.whatsappNumber}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, whatsappNumber: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00] font-bold text-gray-800"
                placeholder="6285128024754"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Gunakan awalan <strong>62</strong> (tanpa simbol + atau spasi). Nomor saat ini:{' '}
                <strong className="text-emerald-600">6285128024754</strong> (0851-2802-4754)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Nama Toko / Resto</label>
                <input
                  type="text"
                  value={formSettings.storeName}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, storeName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Jam Operasional
                </label>
                <input
                  type="text"
                  value={formSettings.storeHours}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, storeHours: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF7A00]" />
                  Alamat Fisik Resto (Untuk Pick-up)
                </label>
                <input
                  type="text"
                  value={formSettings.storeAddress}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, storeAddress: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Koordinat Lokasi GPS (Lat, Long)
                </label>
                <input
                  type="text"
                  value={formSettings.storeCoordinatesStr || '0.5186, 117.5386'}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, storeCoordinatesStr: e.target.value })
                  }
                  placeholder="0.5186, 117.5386"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Biaya Antar Standar (Ongkir)
                </label>
                <input
                  type="number"
                  value={formSettings.deliveryFee}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, deliveryFee: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Batas Belanja Gratis Ongkir
                </label>
                <input
                  type="number"
                  value={formSettings.freeDeliveryThreshold}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      freeDeliveryThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md btn-bounce cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PRATINJAU FORMAT PESAN WA */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <h3 className="font-black text-base text-gray-800">
              Contoh Pesan yang Diterima Kasir di WhatsApp
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Format ini telah distandarisasi sehingga kasir dapat membaca pesanan dalam 3 detik atau
            mencetaknya ke printer Bluetooth thermal:
          </p>

          <pre className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] sm:text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
{`*PESANAN BARU - ${formSettings.storeName.toUpperCase()}* 🥪🍞
Waktu: Rabu, 7 Okt 2026 - 19:40 WITA
---------------------------------------------
*DATA PEMESAN:*
• Nama: Siti Rahma
• No. HP: 081234567890
• Metode: 🛵 Antar ke Alamat (Sangatta)
• Alamat: G house no.151 Swarga Bara, Sangatta Utara (75683)
• Catatan: Pagar hitam, rotinya dipanggang garing ya
---------------------------------------------
*RINCIAN MENU & VARIAN:*
1. 1x Roti Bakar Nutella - Chocomaltine (Rp 30.000)
   - Tingkat Panggang: Garing & Renyah Crispy
   + Topping: Ekstra Keju Parut Melimpah (+Rp 5.000)

2. 1x Es Cokelat Lumer Segar (Rp 15.000)
   - Tingkat Kemanisan: Manis Pas Segar

---------------------------------------------
Subtotal Menu : Rp 50.000
Biaya Antar   : Rp 10.000
*TOTAL BAYAR  : Rp 60.000*
---------------------------------------------
Mohon dicek dan info nomor rekening / QRIS pembayaran ya, Admin. Terima kasih! 🙏`}
          </pre>
        </div>
      )}

      {/* TAB 4: KONEKSI CLOUD FIREBASE (MULTI-DEVICE REALTIME SYNC) */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 max-w-2xl">
          {/* Cloud Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${isCloudActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-800">Status Sinkronisasi Cloud</h3>
                  <p className="text-xs text-gray-400">Database Firestore Real-time Multi-Perangkat</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isCloudActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isCloudActive ? '🟢 Terhubung Real-Time' : '🟡 Mode Penyimpanan Lokal'}
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isCloudActive ? (
                <span>
                  🎉 <strong>Firebase Cloud Firestore aktif!</strong> Setiap kali Anda mengubah stok (Ready/Habis), mengganti harga, atau menambah menu di dashboard ini, perubahan akan <strong>langsung terlihat di HP seluruh pelanggan secara real-time</strong> tanpa perlu refresh.
                </span>
              ) : (
                <span>
                  Saat ini aplikasi berjalan dalam <strong>Mode Penyimpanan Lokal (Offline)</strong>. Menu disimpan di peramban ini. Untuk menghubungkan ke database cloud gratis agar perubahan menu langsung berlaku ke seluruh HP pelanggan, masukkan konfigurasi Firebase di bawah ini.
                </span>
              )}
            </p>

            {/* Quick Sync Button */}
            {isCloudActive && (
              <div className="pt-2">
                <button
                  onClick={handleSyncAllToCloud}
                  disabled={isSyncingCloud}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm btn-bounce cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {isSyncingCloud
                      ? 'Sedang Mengunggah...'
                      : `Unggah Semua Menu (${products.length} Item) ke Cloud`}
                  </span>
                </button>
              </div>
            )}

            {cloudMsg && (
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700">
                {cloudMsg}
              </div>
            )}
          </div>

          {/* Firebase Config Form */}
          <form
            onSubmit={handleSaveCloudConfig}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#FF7A00]" />
              <h4 className="font-extrabold text-sm text-gray-800">
                Pengaturan Firebase Config (JSON)
              </h4>
            </div>

            <p className="text-xs text-gray-500">
              Salin dan tempel objek <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">firebaseConfig</code> dari Firebase Console:
            </p>

            <textarea
              rows={8}
              value={firebaseConfigInput}
              onChange={(e) => setFirebaseConfigInput(e.target.value)}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "beliyuk-jajan.firebaseapp.com",\n  "projectId": "beliyuk-jajan",\n  "storageBucket": "beliyuk-jajan.firebasestorage.app",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
              className="w-full p-3 font-mono text-xs rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF7A00]"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-bold text-xs shadow-sm cursor-pointer btn-bounce"
              >
                Simpan & Hubungkan Firebase
              </button>

              {isCloudActive && (
                <button
                  type="button"
                  onClick={handleDisconnectCloud}
                  className="px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs cursor-pointer"
                >
                  Putuskan Koneksi Cloud
                </button>
              )}
            </div>
          </form>

          {/* Panduan Singkat Firebase untuk Orang Awam */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-5 space-y-2 text-xs text-amber-900">
            <h5 className="font-extrabold text-sm flex items-center gap-1.5 text-amber-950">
              💡 Cara Mendapatkan Firebase Gratis (3 Langkah Mudah):
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-700 font-medium leading-relaxed pl-1">
              <li>
                Buka situs <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-800 underline font-bold">console.firebase.google.com</a> dan login dengan akun Google Anda (Gratis).
              </li>
              <li>
                Klik <strong>"Add project"</strong> & beri nama misal <em>beliyuk-jajan</em>.
              </li>
              <li>
                Buka menu <strong>Firestore Database</strong> &rarr; klik <strong>Create Database</strong> (pilih Test mode / allow read, write).
              </li>
              <li>
                Buka <strong>Project settings (ikon gerigi)</strong> &rarr; pilih icon Web (<code className="text-xs">&lt;/&gt;</code>) &rarr; salin isi objek <strong>firebaseConfig</strong> dan tempel di kolom atas!
              </li>
            </ol>
          </div>

          {/* Official Engineering & Developer Studio Card */}
          <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-blue-900/40 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider border border-blue-400/20">
                  Engineering Studio
                </div>
                <h5 className="font-black text-base text-white tracking-tight">
                  AuraCore Labs Indonesia
                </h5>
                <p className="text-xs text-blue-200/80 max-w-lg leading-relaxed font-normal">
                  Sistem aplikasi katalog web, manajemen menu real-time, dan integrasi WhatsApp Beliyuk Jajan dirancang & direkayasa oleh <strong>AuraCore Labs Indonesia</strong> dengan standar keamanan siber dan performa tinggi.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0">
                <a
                  href="https://www.auracore.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  title="Kunjungi website resmi AuraCore Labs Indonesia"
                >
                  <span>www.auracore.my.id</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://wa.me/6282256657700"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-blue-800/80 hover:bg-blue-800 text-white border border-blue-400/30 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
                  title="Hubungi dukungan teknis AuraCore Labs Indonesia"
                >
                  <span>Bantuan Teknis</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PROMOS: KELOLA PROMO BANNER & KUPON DISKON */}
      {activeTab === 'promos' && (
        <AdminPromoManager
          promos={promos}
          onToggleActive={onTogglePromoActive}
          onToggleBanner={onTogglePromoBanner}
          onAddPromo={onAddPromo}
          onUpdatePromo={onUpdatePromo}
          onDeletePromo={onDeletePromo}
          onResetPromos={onResetPromos}
          isCloudActive={isCloudActive}
          onSyncPromosToCloud={onSyncPromosToCloud}
        />
      )}

      {/* TAB HERO SLIDES: KELOLA SLIDE BANNER HERO BERANDA */}
      {activeTab === 'hero_slides' && (
        <AdminHeroSlideManager
          slides={heroSlides}
          categories={categories}
          onAddSlide={onAddSlide}
          onUpdateSlide={onUpdateSlide}
          onDeleteSlide={onDeleteSlide}
          onToggleActive={onToggleSlideActive}
          onMoveSlide={onMoveSlide}
          onResetSlides={onResetSlides}
          isCloudActive={isCloudActive}
          onSyncSlidesToCloud={onSyncSlidesToCloud}
        />
      )}

      {/* Modal Tambah & Edit Menu Lengkap (Kontrol Penuh Admin dengan Varian, Topping, Diskon & Status) */}
      <AdminProductModal
        key={editingProduct ? editingProduct.id : (isAddModalOpen ? 'add-modal' : 'none')}
        isOpen={isAddModalOpen || Boolean(editingProduct)}
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onDelete={(prod) => {
          setEditingProduct(null);
          setIsAddModalOpen(false);
          handleRequestDeleteProduct(prod);
        }}
        onSave={async (savedProduct) => {
          if (editingProduct) {
            await onUpdateProduct(savedProduct);
            setMenuToast(`✅ Menu "${savedProduct.name}" berhasil diperbarui dan disinkronkan ke Cloud!`);
          } else {
            await onAddProduct(savedProduct);
            setMenuToast(`✅ Menu baru "${savedProduct.name}" berhasil ditambahkan ke katalog!`);
          }
          setTimeout(() => setMenuToast(null), 3500);
        }}
      />

      {/* Modal Konfirmasi Hapus Menu (In-App Pure React Modal Dialog) */}
      {productToDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-red-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Hapus Menu dari Database?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Menu <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">"{productToDelete.name}"</span> akan dihapus secara permanen dari Cloud Firestore dan tidak dapat dipulihkan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="flex-1 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Struk POS Thermal (58mm / 80mm untuk Dapur & Kurir) */}
      <ThermalReceiptModal
        isOpen={Boolean(receiptOrder)}
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        storeName={settings?.storeName}
        whatsappNumber={settings?.whatsappNumber}
      />
    </div>
  );
};
