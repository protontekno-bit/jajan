import { useState, useEffect, useMemo, useCallback } from 'react';
import { PRODUCTS } from '../data/products.js';
import { DEFAULT_CATEGORIES } from '../data/categories.js';
import { filterCatalog } from '../utils/filter.js';
import { APP_CONFIG } from '../config/constants.js';
import {
  isFirebaseConfigured,
  subscribeToCloudProducts,
  saveProductToCloud,
  updateCloudAvailability,
  deleteProductFromCloud,
  seedProductsToCloud,
  subscribeToCloudCategories,
  saveCategoryToCloud,
  deleteCategoryFromCloud,
  seedCategoriesToCloud,
} from '../services/firebase.js';

/**
 * Safely normalizes and validates variant groups and their options.
 * Ensures consistent structure, types, and removes undefined/corrupt entries.
 */
const sanitizeVariants = (variants) => {
  if (!Array.isArray(variants)) return [];
  return variants
    .filter((g) => g && typeof g === 'object' && g.name?.trim())
    .map((g, gIdx) => ({
      id: g.id || `var_${Date.now()}_${gIdx}`,
      name: g.name.trim(),
      type: g.type === 'checkbox' ? 'checkbox' : 'radio',
      required: Boolean(g.required),
      options: Array.isArray(g.options)
        ? g.options
            .filter((opt) => opt && typeof opt === 'object' && opt.name?.trim())
            .map((opt, oIdx) => ({
              id: opt.id || `opt_${Date.now()}_${gIdx}_${oIdx}`,
              name: opt.name.trim(),
              priceExtra: Math.max(0, Number(opt.priceExtra) || 0),
            }))
        : [],
    }));
};

/**
 * Custom hook to manage catalog navigation, search filtering, product updates,
 * and dynamic category taxonomy management.
 * Features seamless real-time synchronization with Firebase Cloud Firestore
 * with robust offline fallback to LocalStorage.
 */
export const useCatalog = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isCloudActive = isFirebaseConfigured();

  // 1. Categories state with localStorage persistence
  const [categoriesList, setCategoriesList] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.categories);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((c) => String(c.id).toLowerCase()));
        const missingDefaults = DEFAULT_CATEGORIES.filter(
          (c) => !existingIds.has(String(c.id).toLowerCase())
        );
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          merged.sort((a, b) => {
            if (a.id === 'all') return -1;
            if (b.id === 'all') return 1;
            return (a.order ?? 0) - (b.order ?? 0);
          });
          localStorage.setItem(APP_CONFIG.storageKeys.categories, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Sync categories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.categories, JSON.stringify(categoriesList));
    } catch (e) {
      console.error('Failed to sync categories to localStorage:', e);
    }
  }, [categoriesList]);

  // Real-time Cloud Categories listener
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeToCloudCategories(
      (cloudCats) => {
        if (cloudCats && cloudCats.length > 0) {
          const existingCatIds = new Set(cloudCats.map((c) => String(c.id).toLowerCase()));
          const missingDefaults = DEFAULT_CATEGORIES.filter(
            (c) => !existingCatIds.has(String(c.id).toLowerCase())
          );
          if (missingDefaults.length > 0) {
            const mergedCats = [...cloudCats, ...missingDefaults];
            mergedCats.sort((a, b) => {
              if (a.id === 'all') return -1;
              if (b.id === 'all') return 1;
              return (a.order ?? 0) - (b.order ?? 0);
            });
            setCategoriesList(mergedCats);
            missingDefaults.forEach((cat) => {
              saveCategoryToCloud(cat).catch((err) =>
                console.warn(`Failed to auto-sync category ${cat.id} to cloud:`, err)
              );
            });
          } else {
            setCategoriesList(cloudCats);
          }
        } else if (cloudCats === null) {
          seedCategoriesToCloud(DEFAULT_CATEGORIES).catch((err) => {
            console.warn('Auto-seed categories to Firestore failed:', err);
          });
        }
      },
      (error) => {
        console.warn('Falling back to local categories due to Firestore error:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Products state with localStorage persistence
  const [productsList, setProductsList] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.products);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => String(p.id)));
        const missingDefaults = PRODUCTS.filter((p) => !existingIds.has(String(p.id)));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          merged.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return (a.order ?? 0) - (b.order ?? 0);
            }
            return (Number(a.id) || 0) - (Number(b.id) || 0);
          });
          localStorage.setItem(APP_CONFIG.storageKeys.products, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return PRODUCTS.map((p, idx) => ({ ...p, order: p.order ?? idx }));
    } catch {
      return PRODUCTS.map((p, idx) => ({ ...p, order: p.order ?? idx }));
    }
  });

  // Sync products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.products, JSON.stringify(productsList));
    } catch (e) {
      console.error('Failed to sync products to localStorage:', e);
    }
  }, [productsList]);

  // Multi-Tab real-time synchronization via browser storage event
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === APP_CONFIG.storageKeys.products && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setProductsList(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse cross-tab products update:', e);
        }
      }
      if (event.key === APP_CONFIG.storageKeys.categories && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setCategoriesList(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse cross-tab categories update:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Real-time Cloud Products Listener
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeToCloudProducts(
      (cloudProducts) => {
        if (cloudProducts && cloudProducts.length > 0) {
          // Normalize IDs to string for reliable lookup
          const existingCloudIds = new Set(cloudProducts.map((p) => String(p.id)));
          const missingDefaults = PRODUCTS.filter((p) => !existingCloudIds.has(String(p.id)));

          if (missingDefaults.length > 0) {
            const merged = [...cloudProducts, ...missingDefaults];
            merged.sort((a, b) => {
              if (a.order !== undefined && b.order !== undefined) {
                return (a.order ?? 0) - (b.order ?? 0);
              }
              return (Number(a.id) || 0) - (Number(b.id) || 0);
            });
            setProductsList(merged);
            // Auto-persist missing products to Firestore so cloud database stays complete
            missingDefaults.forEach((item, idx) => {
              saveProductToCloud({ ...item, order: item.order ?? (cloudProducts.length + idx) }).catch((err) => {
                console.warn(`Failed to auto-sync missing product ${item.id} to cloud:`, err);
              });
            });
          } else {
            setProductsList(cloudProducts);
          }
        } else if (cloudProducts === null) {
          seedProductsToCloud(PRODUCTS).catch((err) => {
            console.warn('Auto-seed to Firestore failed (check Firestore rules):', err);
          });
        }
      },
      (error) => {
        console.warn('Falling back to local catalog due to Firestore error:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Admin action: Toggle ready / out of stock
  const toggleAvailability = useCallback((productId) => {
    setProductsList((prev) => {
      let updatedProd = null;
      const updated = prev.map((p) => {
        if (String(p.id) === String(productId)) {
          const nextVal = !p.isAvailable;
          updatedProd = { ...p, isAvailable: nextVal };
          return updatedProd;
        }
        return p;
      });
      if (isFirebaseConfigured() && updatedProd) {
        updateCloudAvailability(productId, updatedProd.isAvailable).catch(console.error);
      }
      return updated;
    });
  }, []);

  // Admin action: Toggle product visibility in customer catalog (Tampilkan / Sembunyikan)
  const toggleProductActive = useCallback((productId) => {
    setProductsList((prev) => {
      let updatedProd = null;
      const updated = prev.map((p) => {
        if (String(p.id) === String(productId)) {
          const nextVal = p.isActive === false;
          updatedProd = { ...p, isActive: nextVal };
          return updatedProd;
        }
        return p;
      });
      if (isFirebaseConfigured() && updatedProd) {
        saveProductToCloud(updatedProd).catch(console.error);
      }
      return updated;
    });
  }, []);

  // Admin action: Move product position up or down in catalog
  const moveProduct = useCallback(
    async (productId, direction) => {
      const idx = productsList.findIndex((p) => String(p.id) === String(productId));
      if (idx === -1) return productsList;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= productsList.length) return productsList;

      const updated = [...productsList];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      const reordered = updated.map((item, i) => ({
        ...item,
        order: i,
      }));

      setProductsList(reordered);
      try {
        localStorage.setItem(APP_CONFIG.storageKeys.products, JSON.stringify(reordered));
      } catch (err) {
        console.warn('Failed to save reordered products to localStorage:', err);
      }

      if (isFirebaseConfigured()) {
        try {
          await seedProductsToCloud(reordered);
        } catch (err) {
          console.warn('Failed to sync reordered products to Cloud:', err);
        }
      }

      return reordered;
    },
    [productsList]
  );

  // Admin action: Update existing product with full attributes
  const updateProduct = useCallback((updatedProduct) => {
    const sanitized = {
      ...updatedProduct,
      id: String(updatedProduct.id),
      price: Number(updatedProduct.price) || 0,
      originalPrice: updatedProduct.originalPrice ? Number(updatedProduct.originalPrice) : null,
      rating: updatedProduct.rating !== undefined ? Number(updatedProduct.rating) : 5.0,
      isAvailable: updatedProduct.isAvailable !== false,
      isActive: updatedProduct.isActive !== false,
      variants: sanitizeVariants(updatedProduct.variants),
    };
    setProductsList((prev) =>
      prev.map((p) => (String(p.id) === String(sanitized.id) ? sanitized : p))
    );
    if (isFirebaseConfigured()) {
      saveProductToCloud(sanitized).catch(console.error);
    }
  }, []);

  // Admin action: Add a new product with full attributes
  const addProduct = useCallback((newProduct) => {
    const itemToAdd = {
      ...newProduct,
      id: newProduct.id ? String(newProduct.id) : String(Date.now()),
      price: Number(newProduct.price) || 0,
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
      rating: newProduct.rating !== undefined ? Number(newProduct.rating) : 5.0,
      isAvailable: newProduct.isAvailable !== false,
      isActive: newProduct.isActive !== false,
      order: 0,
      variants: sanitizeVariants(newProduct.variants),
    };
    setProductsList((prev) => {
      const nextList = [
        itemToAdd,
        ...prev.map((item, idx) => ({ ...item, order: idx + 1 })),
      ];
      return nextList;
    });
    if (isFirebaseConfigured()) {
      saveProductToCloud(itemToAdd).catch(console.error);
    }
  }, []);

  // Admin action: Delete a product
  const deleteProduct = useCallback((productId) => {
    setProductsList((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    if (isFirebaseConfigured()) {
      deleteProductFromCloud(productId).catch(console.error);
    }
  }, []);

  // Admin action: Upload/Seed all local products to Cloud Firestore
  const syncLocalToCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Konfigurasi Firebase belum terpasang!');
    }
    await seedProductsToCloud(productsList);
    return true;
  }, [productsList]);

  // Admin action: Reset to default products
  const resetProductsToDefault = useCallback(() => {
    setProductsList(PRODUCTS);
    if (isFirebaseConfigured()) {
      seedProductsToCloud(PRODUCTS).catch(console.error);
    }
  }, []);

  // Category Actions
  const addCategory = useCallback(async (newCategory) => {
    const slug = (
      newCategory.id ||
      newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    ).trim();

    const catItem = {
      id: slug,
      name: newCategory.name.trim(),
      icon: newCategory.icon || '🏷️',
      order: categoriesList.length,
    };

    setCategoriesList((prev) => [...prev, catItem]);
    if (isFirebaseConfigured()) {
      await saveCategoryToCloud(catItem);
    }
    return catItem;
  }, [categoriesList.length]);

  const updateCategory = useCallback(async (catId, updatedFields) => {
    let finalCat = null;
    setCategoriesList((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          finalCat = { ...c, ...updatedFields };
          return finalCat;
        }
        return c;
      })
    );
    if (isFirebaseConfigured() && finalCat) {
      await saveCategoryToCloud(finalCat);
    }
  }, []);

  const deleteCategory = useCallback(async (catId) => {
    if (catId === 'all') {
      alert('Kategori "Semua Menu" adalah kategori utama sistem dan tidak dapat dihapus.');
      return false;
    }
    setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
    if (isFirebaseConfigured()) {
      await deleteCategoryFromCloud(catId);
    }
    return true;
  }, []);

  const resetCategoriesToDefault = useCallback(async () => {
    setCategoriesList(DEFAULT_CATEGORIES);
    if (isFirebaseConfigured()) {
      await seedCategoriesToCloud(DEFAULT_CATEGORIES);
    }
  }, []);

  const syncCategoriesToCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) throw new Error('Firebase belum aktif');
    await seedCategoriesToCloud(categoriesList);
  }, [categoriesList]);

  // Move category 1 step left/up or right/down
  const moveCategory = useCallback(
    async (catId, direction) => {
      if (catId === 'all') return categoriesList; // 'all' remains pinned at index 0

      // Separate 'all' and custom categories
      const allCat = categoriesList.find((c) => c.id === 'all') || {
        id: 'all',
        name: 'Semua Menu',
        icon: '🍞',
        order: 0,
      };
      const customCats = categoriesList.filter((c) => c.id !== 'all');

      const currentIndex = customCats.findIndex((c) => c.id === catId);
      if (currentIndex === -1) return categoriesList;

      const targetIndex = direction === 'left' || direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= customCats.length) {
        return categoriesList; // Out of bounds
      }

      // Swap in array
      const swapped = [...customCats];
      const temp = swapped[currentIndex];
      swapped[currentIndex] = swapped[targetIndex];
      swapped[targetIndex] = temp;

      // Re-assign explicit sequential order numbers: 0 for 'all', 1..N for custom categories
      const updatedList = [
        { ...allCat, order: 0 },
        ...swapped.map((cat, idx) => ({
          ...cat,
          order: idx + 1,
        })),
      ];

      setCategoriesList(updatedList);
      try {
        localStorage.setItem(APP_CONFIG.storageKeys.categories, JSON.stringify(updatedList));
      } catch (err) {
        console.warn('Failed to save reordered categories to localStorage:', err);
      }

      if (isFirebaseConfigured()) {
        try {
          await seedCategoriesToCloud(updatedList);
        } catch (err) {
          console.warn('Failed to sync reordered categories to Cloud:', err);
        }
      }

      return updatedList;
    },
    [categoriesList]
  );

  // Reorder category directly to a specific 1-based order position (1, 2, 3...)
  const reorderCategoryToPosition = useCallback(
    async (catId, newPosition1Based) => {
      if (catId === 'all') return categoriesList;

      const allCat = categoriesList.find((c) => c.id === 'all') || {
        id: 'all',
        name: 'Semua Menu',
        icon: '🍞',
        order: 0,
      };
      const customCats = categoriesList.filter((c) => c.id !== 'all');

      const currentIndex = customCats.findIndex((c) => c.id === catId);
      if (currentIndex === -1) return categoriesList;

      const targetIndex = Math.max(0, Math.min(newPosition1Based - 1, customCats.length - 1));
      if (targetIndex === currentIndex) return categoriesList;

      const itemToMove = customCats[currentIndex];
      const remaining = customCats.filter((_, idx) => idx !== currentIndex);
      remaining.splice(targetIndex, 0, itemToMove);

      const updatedList = [
        { ...allCat, order: 0 },
        ...remaining.map((cat, idx) => ({
          ...cat,
          order: idx + 1,
        })),
      ];

      setCategoriesList(updatedList);
      try {
        localStorage.setItem(APP_CONFIG.storageKeys.categories, JSON.stringify(updatedList));
      } catch (err) {
        console.warn('Failed to save reordered categories to localStorage:', err);
      }

      if (isFirebaseConfigured()) {
        try {
          await seedCategoriesToCloud(updatedList);
        } catch (err) {
          console.warn('Failed to sync reordered categories to Cloud:', err);
        }
      }

      return updatedList;
    },
    [categoriesList]
  );

  const filteredProducts = useMemo(
    () => filterCatalog(productsList, activeCategory, searchQuery),
    [productsList, activeCategory, searchQuery]
  );

  const activeCategoryObj = useMemo(
    () => categoriesList.find((c) => c.id === activeCategory) || categoriesList[0],
    [activeCategory, categoriesList]
  );

  return {
    categories: categoriesList,
    allProducts: productsList,
    products: filteredProducts,
    activeCategory,
    activeCategoryObj,
    searchQuery,
    setActiveCategory,
    setSearchQuery,
    totalResults: filteredProducts.length,
    isCloudActive,
    // Admin product functions
    toggleAvailability,
    toggleProductActive,
    moveProduct,
    updateProduct,
    addProduct,
    deleteProduct,
    syncLocalToCloud,
    resetProductsToDefault,
    // Admin category functions
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault,
    syncCategoriesToCloud,
    moveCategory,
    reorderCategoryToPosition,
  };
};
