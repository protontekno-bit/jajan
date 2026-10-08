import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AddressBar } from './components/layout/AddressBar.jsx';
import { Header } from './components/layout/Header.jsx';
import { HeroSection } from './components/layout/HeroSection.jsx';
import { PromoBanners } from './components/layout/PromoBanners.jsx';
import { CategoryFilter } from './components/catalog/CategoryFilter.jsx';
import { ProductGrid } from './components/catalog/ProductGrid.jsx';
import { VariantModal } from './components/catalog/VariantModal.jsx';
import { FloatingCartBar } from './components/cart/FloatingCartBar.jsx';
import { CartDrawerModal } from './components/cart/CartDrawerModal.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { Toast } from './components/common/Toast.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';
import { PromoView } from './components/views/PromoView.jsx';
import { OrdersView } from './components/views/OrdersView.jsx';
import { ProfileView } from './components/views/ProfileView.jsx';
import { subscribeAdminAuth, logoutAdmin } from './services/firebase.js';
import { useCatalog } from './hooks/useCatalog.js';
import { useCart } from './hooks/useCart.js';
import { useOrders } from './hooks/useOrders.js';
import { useAdminSettings } from './hooks/useAdminSettings.js';
import { usePromos } from './hooks/usePromos.js';
import { useHeroSlides } from './hooks/useHeroSlides.js';

// Lazy-load Admin Components to optimize customer bundle size
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard.jsx').then((m) => ({ default: m.AdminDashboard }))
);
const AdminLoginPage = lazy(() =>
  import('./components/admin/AdminLoginPage.jsx').then((m) => ({ default: m.AdminLoginPage }))
);

/**
 * Main Beliyuk Jajan Application Container
 * Strictly separates Customer Portal (/) from Owner Admin Portal (/admin)
 * using Standard Production Architecture with Firebase Authentication.
 */
export default function App() {
  // Check if current URL path or hash indicates Admin Portal
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path === '/admin' || path.startsWith('/admin/') || hash.includes('admin');
  };

  const [activeTab, setActiveTabState] = useState(() => {
    return checkIsAdminPath() ? 'admin' : 'home';
  }); // 'home' | 'promo' | 'orders' | 'profile' | 'admin'

  // Admin Authentication State (Strict Firebase Authentication Only)
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeAdminAuth((user) => {
      setFirebaseUser(user);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const isAdminAuthenticated = Boolean(firebaseUser);

  // Tab switch handler with URL synchronization
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin') {
        if (window.location.pathname !== '/admin') {
          window.history.pushState({ tab: 'admin' }, '', '/admin');
        }
      } else {
        if (window.location.pathname === '/admin') {
          window.history.pushState({ tab }, '', '/');
        }
      }
    }
  };

  // Sync with browser back/forward and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkIsAdminPath()) {
        setActiveTabState('admin');
      } else if (window.location.hash === '#orders') {
        setActiveTabState('orders');
      } else if (window.location.hash === '#promo') {
        setActiveTabState('promo');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Admin Logout Handler
  const handleAdminLogout = async () => {
    await logoutAdmin();
    setFirebaseUser(null);
    setToastMessage('Sesi administrator telah keluar.');
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);

  // Admin Settings Hook (WhatsApp number, store name, fees)
  const { settings, updateSettings } = useAdminSettings();

  // Catalog Hook with Cloud sync and local persistence
  const {
    categories,
    allProducts,
    products,
    activeCategory,
    activeCategoryObj,
    searchQuery,
    setActiveCategory,
    setSearchQuery,
    toggleAvailability,
    updateProduct,
    addProduct,
    deleteProduct,
    syncLocalToCloud,
    isCloudActive,
    resetProductsToDefault,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault,
    syncCategoriesToCloud,
    moveCategory,
    reorderCategoryToPosition,
  } = useCatalog();

  // Cart Hook
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
    isAnimating,
  } = useCart();

  // Order Receipts Hook
  const { orders, addOrder, clearOrders } = useOrders();

  // Dynamic Promos & Voucher Coupons Hook
  const {
    promos,
    activePromos,
    activeBannerPromos,
    togglePromoActive,
    togglePromoBanner,
    addPromo,
    updatePromo,
    deletePromo,
    resetPromosToDefault,
    syncPromosToCloud,
  } = usePromos();

  // Dynamic Hero Banner Slides Hook (Multi-category carousel)
  const {
    slidesList: heroSlides,
    activeSlides: activeHeroSlides,
    addSlide: addHeroSlide,
    updateSlide: updateHeroSlide,
    deleteSlide: deleteHeroSlide,
    toggleSlideActive: toggleHeroSlideActive,
    moveSlide: moveHeroSlide,
    resetSlidesToDefault: resetHeroSlidesToDefault,
    syncSlidesToCloud: syncHeroSlidesToCloud,
  } = useHeroSlides();

  // Helper to get current quantity of an item in cart
  const getCartQuantity = (productId) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart with toast feedback
  const handleAddToCart = (product) => {
    addToCart(product);
    setToastMessage(`"${product.name}" ditambahkan ke keranjang!`);
  };

  // Determine section title
  const getGridTitle = () => {
    if (searchQuery.trim()) {
      return `Hasil pencarian: "${searchQuery}"`;
    }
    if (activeCategory === 'all') {
      return 'Semua Menu Roti Bakar';
    }
    return `Menu ${activeCategoryObj.name}`;
  };

  // =========================================================================
  // ROUTE 1: PORTAL ADMIN BACKOFFICE (/admin)
  // Strictly separated from customer UI. Requires authentication.
  // =========================================================================
  if (activeTab === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <Suspense fallback={<LoadingSpinner label="Memuat Portal Akses Admin..." />}>
          <AdminLoginPage
            onLoginSuccess={() => {}}
            onBackToCustomerPortal={() => setActiveTab('home')}
          />
        </Suspense>
      );
    }

    return (
      <div className="min-h-screen bg-[#FFF9F0] text-[#2D3748]">
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
        <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <Suspense fallback={<LoadingSpinner label="Menyiapkan Dasbor Pemilik & Omset..." />}>
            <AdminDashboard
              products={allProducts}
              onToggleAvailability={toggleAvailability}
              onUpdateProduct={updateProduct}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              onResetProducts={resetProductsToDefault}
              isCloudActive={isCloudActive}
              onSyncToCloud={syncLocalToCloud}
              settings={settings}
              onUpdateSettings={updateSettings}
              onBackToCustomerPortal={() => setActiveTab('home')}
              onLogout={handleAdminLogout}
              adminUser={firebaseUser}
              categories={categories}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              onResetCategories={resetCategoriesToDefault}
              onSyncCategoriesToCloud={syncCategoriesToCloud}
              onMoveCategory={moveCategory}
              onReorderCategoryToPosition={reorderCategoryToPosition}
              promos={promos}
              onTogglePromoActive={togglePromoActive}
              onTogglePromoBanner={togglePromoBanner}
              onAddPromo={addPromo}
              onUpdatePromo={updatePromo}
              onDeletePromo={deletePromo}
              onResetPromos={resetPromosToDefault}
              onSyncPromosToCloud={syncPromosToCloud}
              heroSlides={heroSlides}
              onAddSlide={addHeroSlide}
              onUpdateSlide={updateHeroSlide}
              onDeleteSlide={deleteHeroSlide}
              onToggleSlideActive={toggleHeroSlideActive}
              onMoveSlide={moveHeroSlide}
              onResetSlides={resetHeroSlidesToDefault}
              onSyncSlidesToCloud={syncHeroSlidesToCloud}
            />
          </Suspense>
        </main>
      </div>
    );
  }

  // =========================================================================
  // ROUTE 2: PORTAL PELANGGAN BELANJA (/)
  // Pure customer experience: Catalog, Cart, Variants, WhatsApp Checkout
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#2D3748] pb-24 sm:pb-28">
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Top Address Delivery Bar (Mobile App Standard) */}
      <AddressBar />

      {/* Header (Desktop Tabs & Mobile App Bar) */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cartCount={totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5">
        {activeTab === 'home' && (
          <>
            {/* Hero Banner & Search Bar (Multi-Category Carousel) */}
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              heroSlides={activeHeroSlides}
              onSelectCategory={setActiveCategory}
            />

            {/* Mobile-Style Promo Deals Carousel (Auto-hides if empty or all disabled) */}
            <PromoBanners
              promos={activeBannerPromos}
              onSelectPromo={() => setActiveTab('promo')}
            />

            {/* Category Filter Pills & Product Grid Anchor */}
            <div id="catalog-products-section">
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
            </div>

            {/* Product Grid with In-Card Stepper, Tanya Ready & Variant Trigger */}
            <ProductGrid
              products={products}
              title={getGridTitle()}
              getCartQuantity={getCartQuantity}
              onAddToCart={handleAddToCart}
              onOpenVariantModal={setSelectedVariantProduct}
              onUpdateQuantity={updateQuantity}
              onResetFilter={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              whatsappNumber={settings.whatsappNumber}
              storeName={settings.storeName}
            />
          </>
        )}

        {activeTab === 'promo' && (
          <PromoView
            promos={activePromos}
            onBackToCatalog={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onBackToCatalog={() => setActiveTab('home')}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalItems}
            onClearOrders={clearOrders}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView />
        )}
      </main>

      {/* Footer Pelanggan (Discreet staff link) */}
      <Footer onOpenAdmin={() => setActiveTab('admin')} />

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar
        totalItems={totalItems}
        totalPrice={totalPrice}
        isAnimating={isAnimating}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Mobile Bottom Navigation Bar (GoFood / ShopeeFood style, sm:hidden) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cartCount={totalItems}
      />

      {/* Variant Selection Modal */}
      <VariantModal
        product={selectedVariantProduct}
        onClose={() => setSelectedVariantProduct(null)}
        onConfirm={handleAddToCart}
      />

      {/* Cart Drawer Modal */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onOrderPlaced={addOrder}
        totalItems={totalItems}
        totalPrice={totalPrice}
        availableCoupons={activePromos}
      />
    </div>
  );
}
