import { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_PROMOS } from '../data/promos.js';
import { APP_CONFIG } from '../config/constants.js';
import {
  isFirebaseConfigured,
  subscribeToCloudPromos,
  savePromoToCloud,
  updateCloudPromoActive,
  deletePromoFromCloud,
  seedPromosToCloud,
} from '../services/firebase.js';

/**
 * Custom hook to manage Promo Banners & Voucher Coupons dynamically.
 * Features real-time Firestore sync with resilient offline LocalStorage fallback.
 */
export const usePromos = () => {
  const isCloudActive = isFirebaseConfigured();

  // Local state with LocalStorage cache
  const [promosList, setPromosList] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.promos);
      return saved ? JSON.parse(saved) : DEFAULT_PROMOS;
    } catch {
      return DEFAULT_PROMOS;
    }
  });

  // 1. Sync state to localStorage & broadcast event locally
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.promos, JSON.stringify(promosList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beliyuk:promos_updated'));
      }
    } catch (e) {
      console.error('Failed to sync promos to localStorage:', e);
    }
  }, [promosList]);

  // 2. Real-time Multi-Tab Storage Listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === APP_CONFIG.storageKeys.promos && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setPromosList(parsed);
          }
        } catch (err) {
          console.warn('Error syncing promos from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 3. Real-time Firebase Cloud Firestore Listener
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeToCloudPromos(
      (cloudPromos) => {
        if (cloudPromos && cloudPromos.length > 0) {
          setPromosList(cloudPromos);
        } else if (cloudPromos === null) {
          // Cloud collection is empty -> auto seed with default promos
          seedPromosToCloud(DEFAULT_PROMOS).catch((err) => {
            console.warn('Auto-seed promos to Firestore failed:', err);
          });
        }
      },
      (error) => {
        console.warn('Falling back to local promos due to Firestore error:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered lists
  const activePromos = useMemo(
    () => promosList.filter((p) => p.isActive),
    [promosList]
  );

  const activeBannerPromos = useMemo(
    () => promosList.filter((p) => p.isActive && p.showInBanner !== false),
    [promosList]
  );

  // Toggle promo active state (ON/OFF)
  const togglePromoActive = useCallback(
    async (promoId) => {
      let targetPromo = null;
      setPromosList((prev) =>
        prev.map((p) => {
          if (p.id === promoId) {
            targetPromo = { ...p, isActive: !p.isActive };
            return targetPromo;
          }
          return p;
        })
      );

      if (isFirebaseConfigured() && targetPromo) {
        await updateCloudPromoActive(promoId, targetPromo.isActive);
      }
    },
    []
  );

  // Toggle show in home banner carousel
  const togglePromoBanner = useCallback(
    async (promoId) => {
      let targetPromo = null;
      setPromosList((prev) =>
        prev.map((p) => {
          if (p.id === promoId) {
            targetPromo = { ...p, showInBanner: !p.showInBanner };
            return targetPromo;
          }
          return p;
        })
      );

      if (isFirebaseConfigured() && targetPromo) {
        await savePromoToCloud(targetPromo);
      }
    },
    []
  );

  // Add new promo
  const addPromo = useCallback(
    async (newPromo) => {
      const promoWithId = {
        id: newPromo.id || `promo-${Date.now()}`,
        isActive: newPromo.isActive ?? true,
        showInBanner: newPromo.showInBanner ?? true,
        ...newPromo,
      };

      setPromosList((prev) => [promoWithId, ...prev]);

      if (isFirebaseConfigured()) {
        await savePromoToCloud(promoWithId);
      }
      return promoWithId;
    },
    []
  );

  // Update existing promo
  const updatePromo = useCallback(
    async (promoId, updatedFields) => {
      let finalPromo = null;
      setPromosList((prev) =>
        prev.map((p) => {
          if (p.id === promoId) {
            finalPromo = { ...p, ...updatedFields };
            return finalPromo;
          }
          return p;
        })
      );

      if (isFirebaseConfigured() && finalPromo) {
        await savePromoToCloud(finalPromo);
      }
    },
    []
  );

  // Delete promo
  const deletePromo = useCallback(
    async (promoId) => {
      setPromosList((prev) => prev.filter((p) => p.id !== promoId));

      if (isFirebaseConfigured()) {
        await deletePromoFromCloud(promoId);
      }
    },
    []
  );

  // Reset to default presets
  const resetPromosToDefault = useCallback(async () => {
    setPromosList(DEFAULT_PROMOS);
    if (isFirebaseConfigured()) {
      await seedPromosToCloud(DEFAULT_PROMOS);
    }
  }, []);

  // Sync local promos to cloud manually
  const syncPromosToCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase belum dikonfigurasi!');
    }
    return await seedPromosToCloud(promosList);
  }, [promosList]);

  return {
    promos: promosList,
    activePromos,
    activeBannerPromos,
    togglePromoActive,
    togglePromoBanner,
    addPromo,
    updatePromo,
    deletePromo,
    resetPromosToDefault,
    syncPromosToCloud,
    isCloudActive,
  };
};
