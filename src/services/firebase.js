/**
 * @fileoverview Firebase Client & Cloud Firestore Service Layer
 * Provides real-time synchronization between Admin Dashboard and all customer devices.
 * Features graceful offline fallback to LocalStorage if Firebase is unconfigured.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';


const STORAGE_KEY_FIREBASE_CONFIG = 'beliyuk_firebase_config_v1';

/**
 * Official Project Credentials for Beliyuk Jajan / UMKM Portal
 */
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDirKwzrt7TYwP9budkYS7Q8fTIBKR7aik",
  authDomain: "umknportal.firebaseapp.com",
  projectId: "umknportal",
  storageBucket: "umknportal.firebasestorage.app",
  messagingSenderId: "670755999320",
  appId: "1:670755999320:web:b28df591fdf8ad9d0b042d",
};

/**
 * Retrieve Firebase Configuration from localStorage, env, or default official credentials.
 */
export const getStoredFirebaseConfig = () => {
  if (typeof window === 'undefined') return DEFAULT_FIREBASE_CONFIG;

  // 1. Check localStorage first (if custom override exists)
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (fromStorage) {
      return JSON.parse(fromStorage);
    }
  } catch (e) {
    console.warn('Failed to parse stored Firebase config:', e);
  }

  // 2. Check Vite Environment Variables
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // 3. Fallback to official umknportal config
  return DEFAULT_FIREBASE_CONFIG;
};

// Singleton Firebase instances
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let firebaseStorage = null;

/**
 * Initialize Firebase App, Firestore, Auth, and Cloud Storage safely.
 */
export const initFirebase = () => {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    if (config.storageBucket) {
      try {
        firebaseStorage = getStorage(firebaseApp);
      } catch (storageErr) {
        console.warn('Firebase Storage init notice:', storageErr);
      }
    }
    return {
      app: firebaseApp,
      db: firestoreDb,
      auth: firebaseAuth,
      storage: firebaseStorage,
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

/**
 * Upload compressed product image (Base64 WebP/JPEG) to Firebase Cloud Storage.
 * Returns public HTTPS download URL, or gracefully falls back to dataUrl.
 *
 * @param {string} dataUrl - Compressed data URL
 * @param {string|number} [productId] - Associated product ID
 * @returns {Promise<string>} Public HTTPS Download URL or fallback dataUrl
 */
export const uploadProductImageToStorage = async (dataUrl, productId = 'new') => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl; // Already a remote HTTP/HTTPS URL
  }

  const instances = initFirebase();
  if (!instances || !instances.storage) {
    console.warn('Firebase Storage not ready, fallback to local compressed dataUrl.');
    return dataUrl;
  }

  try {
    const timestamp = Date.now();
    const cleanId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `products/menu_${cleanId}_${timestamp}.webp`;
    const imageRef = storageRef(instances.storage, path);

    const metadata = {
      contentType: dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
      customMetadata: {
        app: 'Beliyuk Jajan',
        uploadedAt: new Date().toISOString(),
      },
    };

    await uploadString(imageRef, dataUrl, 'data_url', metadata);
    const downloadUrl = await getDownloadURL(imageRef);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload notice (using resilient dataUrl):', error);
    return dataUrl; // Graceful fallback
  }
};

/**
 * Check if Firebase is currently connected and active.
 */
export const isFirebaseConfigured = () => {
  const config = getStoredFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

/**
 * Save Firebase configuration from Admin UI and reinitialize.
 * @param {Object} config
 */
export const saveFirebaseConfig = (config) => {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
      firebaseApp = null;
      firestoreDb = null;
      return true;
    }
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    initFirebase();
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    return false;
  }
};

/**
 * Real-time listener for products collection from Cloud Firestore.
 * Automatically synchronizes changes to every connected customer device.
 * @param {(products: Array) => void} onUpdate
 * @param {(error: any) => void} [onError]
 * @returns {(() => void) | null} Unsubscribe function
 */
export const subscribeToCloudProducts = (onUpdate, onError) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    return null;
  }

  try {
    const productsCol = collection(instances.db, 'products');
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }

        const items = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            ...data,
            id: docSnap.id,
            docId: docSnap.id,
          });
        });

        // Sort items by custom sequence order or numeric ID fallback
        items.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return (Number(a.id) || 0) - (Number(b.id) || 0);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore subscription error (fallback to local):', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup Firestore listener:', e);
    return null;
  }
};

/**
 * Sync / Seed all local products to Cloud Firestore in a single batch.
 * @param {Array} [productsList]
 */
export const seedProductsToCloud = async (productsList = []) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Firebase belum dikonfigurasi!');
  }

  const batch = writeBatch(instances.db);
  const productsCol = collection(instances.db, 'products');

  productsList.forEach((prod, idx) => {
    const docRef = doc(productsCol, String(prod.id));
    batch.set(docRef, { ...prod, order: prod.order ?? idx });
  });

  await batch.commit();
  return true;
};

/**
 * Recursively cleanses payload to ensure no `undefined` values are sent to Firestore,
 * which would otherwise cause Firestore to throw an exception and reject writes.
 */
const cleanFirestorePayload = (val) => {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(cleanFirestorePayload);
  const res = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      res[k] = cleanFirestorePayload(v);
    }
  }
  return res;
};

/**
 * Save or update a product in Cloud Firestore.
 * @param {Object} product
 */
export const saveProductToCloud = async (product) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Cloud Firestore belum terinisialisasi!');
  }

  let finalProduct = { ...product };

  // Automatically convert compressed Base64 to Firebase Storage URL if applicable
  if (finalProduct.img && finalProduct.img.startsWith('data:image/')) {
    try {
      const storageUrl = await uploadProductImageToStorage(finalProduct.img, finalProduct.id);
      finalProduct.img = storageUrl;
    } catch (storageErr) {
      console.warn('Storage upload error, using current image URL:', storageErr);
    }
  }

  const cleaned = cleanFirestorePayload(finalProduct);
  const docRef = doc(instances.db, 'products', String(finalProduct.id));
  await setDoc(docRef, cleaned, { merge: true });
  return finalProduct;
};

/**
 * Toggle product availability in Cloud Firestore.
 * @param {string|number} productId
 * @param {boolean} isAvailable
 */
export const updateCloudAvailability = async (productId, isAvailable) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Cloud Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'products', String(productId));
  await updateDoc(docRef, { isAvailable });
  return true;
};

/**
 * Delete a product from Cloud Firestore.
 * @param {string|number} productId
 */
export const deleteProductFromCloud = async (productId) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Cloud Firestore belum terinisialisasi!');
  }

  const cleanId = String(productId).trim();
  const docRef = doc(instances.db, 'products', cleanId);
  await deleteDoc(docRef);
  return true;
};

/**
 * Log in admin using Firebase Authentication (Email & Password).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const loginAdmin = async (email, password) => {
  const instances = initFirebase();
  if (!instances || !instances.auth) {
    throw new Error('Firebase Auth belum terinisialisasi!');
  }
  return await signInWithEmailAndPassword(instances.auth, email, password);
};

/**
 * Register a new admin account in Firebase Authentication.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const registerAdmin = async (email, password) => {
  const instances = initFirebase();
  if (!instances || !instances.auth) {
    throw new Error('Firebase Auth belum terinisialisasi!');
  }
  return await createUserWithEmailAndPassword(instances.auth, email, password);
};

/**
 * Sign out current admin user from Firebase Authentication.
 */
export const logoutAdmin = async () => {
  const instances = initFirebase();
  if (instances && instances.auth) {
    await signOut(instances.auth);
  }
};

/**
 * Listen for Firebase Auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {(() => void) | null}
 */
export const subscribeAdminAuth = (callback) => {
  const instances = initFirebase();
  if (!instances || !instances.auth) {
    callback(null);
    return null;
  }
  return onAuthStateChanged(instances.auth, callback);
};

// =========================================================================
// CENTRALIZED ORDER MANAGEMENT (CLOUD FIRESTORE)
// =========================================================================

/**
 * Save customer order into Cloud Firestore `orders` collection.
 * @param {Object} orderData
 * @returns {Promise<string>} Order ID
 */
export const saveOrderToCloud = async (orderData) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    console.warn('Firebase not active, order saved locally only.');
    return orderData.id || `BJ-${Date.now()}`;
  }

  try {
    const orderId = orderData.id || `BJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const docRef = doc(instances.db, 'orders', String(orderId));
    const payload = {
      ...orderData,
      id: orderId,
      status: orderData.status || 'Pesanan Baru 🔔',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    await setDoc(docRef, payload);
    return orderId;
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
    return orderData.id || `BJ-${Date.now()}`;
  }
};

/**
 * Real-time listener for incoming orders from Cloud Firestore.
 * Sorted chronologically descending (newest order on top).
 * @param {(orders: Array) => void} onUpdate
 * @param {(error: any) => void} [onError]
 * @returns {(() => void) | null} Unsubscribe function
 */
export const subscribeToCloudOrders = (onUpdate, onError) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return null;

  try {
    const ordersCol = collection(instances.db, 'orders');
    const q = query(ordersCol, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({
            ...docSnap.data(),
            id: docSnap.data().id || docSnap.id,
          });
        });
        onUpdate(list);
      },
      (err) => {
        // Fallback without orderBy if composite index needed
        console.warn('Orders query listener fallback:', err);
        const fallbackUnsubscribe = onSnapshot(ordersCol, (snap) => {
          const list = [];
          snap.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.data().id || docSnap.id });
          });
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          onUpdate(list);
        });
        if (onError) onError(err);
        return fallbackUnsubscribe;
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to orders:', err);
    return null;
  }
};

/**
 * Update order status in Cloud Firestore (e.g., 'Sedang Disiapkan', 'Selesai', 'Batal').
 * @param {string|number} orderId
 * @param {string} newStatus
 */
export const updateOrderStatusInCloud = async (orderId, newStatus) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return false;

  try {
    const docRef = doc(instances.db, 'orders', String(orderId));
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Failed to update order status:', err);
    return false;
  }
};

/**
 * Delete a single customer order from Cloud Firestore.
 * @param {string|number} orderId
 */
export const deleteOrderFromCloud = async (orderId) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return false;

  try {
    const docRef = doc(instances.db, 'orders', String(orderId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Failed to delete order from Cloud:', err);
    return false;
  }
};

/**
 * Batch delete multiple orders from Cloud Firestore (useful for clearing test orders).
 * @param {Array<string|number>} orderIds
 */
export const clearOrdersFromCloud = async (orderIds = []) => {
  if (!orderIds || orderIds.length === 0) return true;
  const instances = initFirebase();
  if (!instances || !instances.db) return false;

  try {
    const batch = writeBatch(instances.db);
    const ordersCol = collection(instances.db, 'orders');
    orderIds.forEach((id) => {
      const docRef = doc(ordersCol, String(id));
      batch.delete(docRef);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Failed to clear orders from Cloud:', err);
    return false;
  }
};


/**
 * Real-time listener for Promos & Banners from Cloud Firestore `promos` collection.
 * @param {(promos: Array) => void} onUpdate
 * @param {(error: any) => void} [onError]
 * @returns {(() => void) | null}
 */
export const subscribeToCloudPromos = (onUpdate, onError) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return null;

  try {
    const promosCol = collection(instances.db, 'promos');
    const unsubscribe = onSnapshot(
      promosCol,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({
            ...docSnap.data(),
            id: docSnap.data().id || docSnap.id,
          });
        });
        onUpdate(items);
      },
      (err) => {
        console.warn('Firestore promos subscription error (fallback to local):', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to promos:', err);
    return null;
  }
};

/**
 * Save or update a single promo item in Cloud Firestore.
 * @param {Object} promo
 */
export const savePromoToCloud = async (promo) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'promos', String(promo.id));
  await setDoc(docRef, promo, { merge: true });
  return true;
};

/**
 * Toggle promo active status in Cloud Firestore.
 * @param {string|number} promoId
 * @param {boolean} isActive
 */
export const updateCloudPromoActive = async (promoId, isActive) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'promos', String(promoId));
  await updateDoc(docRef, { isActive });
  return true;
};

/**
 * Delete a promo item from Cloud Firestore.
 * @param {string|number} promoId
 */
export const deletePromoFromCloud = async (promoId) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'promos', String(promoId));
  await deleteDoc(docRef);
  return true;
};

/**
 * Batch seed promos into Cloud Firestore.
 * @param {Array} promosList
 */
export const seedPromosToCloud = async (promosList) => {
  const instances = initFirebase();
  if (!instances || !instances.db) throw new Error('Firebase belum aktif');

  const batch = writeBatch(instances.db);
  const promosCol = collection(instances.db, 'promos');

  promosList.forEach((promo) => {
    const docRef = doc(promosCol, String(promo.id));
    batch.set(docRef, promo);
  });

  await batch.commit();
  return true;
};

/**
 * Real-time listener for Categories from Cloud Firestore `categories` collection.
 * @param {(categories: Array) => void} onUpdate
 * @param {(error: any) => void} [onError]
 * @returns {(() => void) | null}
 */
export const subscribeToCloudCategories = (onUpdate, onError) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return null;

  try {
    const catCol = collection(instances.db, 'categories');
    const unsubscribe = onSnapshot(
      catCol,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({
            ...docSnap.data(),
            id: docSnap.data().id || docSnap.id,
          });
        });
        // Sort with 'all' first, then by order or id
        items.sort((a, b) => {
          if (a.id === 'all') return -1;
          if (b.id === 'all') return 1;
          return (a.order || 0) - (b.order || 0);
        });
        onUpdate(items);
      },
      (err) => {
        console.warn('Firestore categories subscription error (fallback to local):', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to categories:', err);
    return null;
  }
};

/**
 * Save or update a single category item in Cloud Firestore.
 * @param {Object} category
 */
export const saveCategoryToCloud = async (category) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'categories', String(category.id));
  await setDoc(docRef, category, { merge: true });
  return true;
};

/**
 * Delete a category item from Cloud Firestore.
 * @param {string} categoryId
 */
export const deleteCategoryFromCloud = async (categoryId) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'categories', String(categoryId));
  await deleteDoc(docRef);
  return true;
};

/**
 * Batch seed categories into Cloud Firestore.
 * @param {Array} categoriesList
 */
export const seedCategoriesToCloud = async (categoriesList) => {
  const instances = initFirebase();
  if (!instances || !instances.db) throw new Error('Firebase belum aktif');

  const batch = writeBatch(instances.db);
  const catCol = collection(instances.db, 'categories');

  categoriesList.forEach((cat, idx) => {
    const docRef = doc(catCol, String(cat.id));
    batch.set(docRef, { ...cat, order: cat.order ?? idx });
  });

  await batch.commit();
  return true;
};

/**
 * Real-time listener for Hero Slides from Cloud Firestore `hero_slides` collection.
 * @param {(slides: Array) => void} onUpdate
 * @param {(error: any) => void} [onError]
 * @returns {(() => void) | null}
 */
export const subscribeToCloudHeroSlides = (onUpdate, onError) => {
  const instances = initFirebase();
  if (!instances || !instances.db) return null;

  try {
    const slidesCol = collection(instances.db, 'hero_slides');
    const unsubscribe = onSnapshot(
      slidesCol,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({
            ...docSnap.data(),
            id: docSnap.data().id || docSnap.id,
          });
        });
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        onUpdate(items);
      },
      (err) => {
        console.warn('Firestore hero_slides subscription error (fallback to local):', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to hero_slides:', err);
    return null;
  }
};

/**
 * Save or update a single hero slide in Cloud Firestore.
 * Automatically uploads compressed base64 image to Firebase Storage if provided.
 * @param {Object} slide
 */
export const saveHeroSlideToCloud = async (slide) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  let finalSlide = { ...slide };
  if (finalSlide.img && finalSlide.img.startsWith('data:image/')) {
    try {
      const storageUrl = await uploadProductImageToStorage(finalSlide.img, `slide_${finalSlide.id}`);
      finalSlide.img = storageUrl;
    } catch (e) {
      console.warn('Storage fallback for slide:', e);
    }
  }

  const docRef = doc(instances.db, 'hero_slides', String(finalSlide.id));
  await setDoc(docRef, finalSlide, { merge: true });
  return true;
};

/**
 * Delete a hero slide item from Cloud Firestore.
 * @param {string} slideId
 */
export const deleteHeroSlideFromCloud = async (slideId) => {
  const instances = initFirebase();
  if (!instances || !instances.db) {
    throw new Error('Koneksi Firebase Firestore belum terinisialisasi!');
  }

  const docRef = doc(instances.db, 'hero_slides', String(slideId));
  await deleteDoc(docRef);
  return true;
};

/**
 * Batch seed hero slides into Cloud Firestore.
 * @param {Array} slidesList
 */
export const seedHeroSlidesToCloud = async (slidesList) => {
  const instances = initFirebase();
  if (!instances || !instances.db) throw new Error('Firebase belum aktif');

  const batch = writeBatch(instances.db);
  const slidesCol = collection(instances.db, 'hero_slides');

  slidesList.forEach((slide, idx) => {
    const docRef = doc(slidesCol, String(slide.id));
    batch.set(docRef, { ...slide, order: slide.order ?? idx });
  });

  await batch.commit();
  return true;
};
