import { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_HERO_SLIDES } from '../data/heroSlides.js';
import { APP_CONFIG } from '../config/constants.js';
import {
  isFirebaseConfigured,
  subscribeToCloudHeroSlides,
  saveHeroSlideToCloud,
  deleteHeroSlideFromCloud,
  seedHeroSlidesToCloud,
} from '../services/firebase.js';

/**
 * Helper to normalize slide items with colorTheme and safe defaults
 */
const normalizeSlide = (slide) => {
  let colorTheme = slide.colorTheme;
  if (!colorTheme) {
    if (slide.targetCategory === 'healthy_food') colorTheme = 'emerald';
    else if (slide.targetCategory === 'minuman') colorTheme = 'blue';
    else colorTheme = 'orange';
  }

  // Auto-migrate legacy default jpg images to transparent png
  let img = slide.img || '/images/hero_roti_bakar_3d.png';
  if (img === '/images/hero_roti_bakar_3d.jpg') img = '/images/hero_roti_bakar_3d.png';
  if (img === '/images/hero_healthy_sandwich_3d.jpg') img = '/images/hero_healthy_sandwich_3d.png';
  if (img === '/images/hero_es_segar_3d.jpg') img = '/images/hero_es_segar_3d.png';

  return {
    ...slide,
    img,
    colorTheme,
    order: slide.order ?? 0,
    isActive: slide.isActive !== false,
  };
};

/**
 * Custom hook to manage dynamic Hero Banner slides with real-time Firebase
 * synchronization and fast offline localStorage persistence.
 */
export const useHeroSlides = () => {
  // 1. Initialize slides from localStorage or default presets
  const [slidesList, setSlidesList] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.heroSlides);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeSlide);
          const existingIds = new Set(normalized.map((s) => String(s.id)));
          const missingDefaults = DEFAULT_HERO_SLIDES.filter(
            (s) => !existingIds.has(String(s.id))
          );
          if (missingDefaults.length > 0) {
            const merged = [...normalized, ...missingDefaults.map(normalizeSlide)];
            merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            localStorage.setItem(APP_CONFIG.storageKeys.heroSlides, JSON.stringify(merged));
            return merged;
          }
          return normalized;
        }
      }
      return DEFAULT_HERO_SLIDES.map(normalizeSlide);
    } catch {
      return DEFAULT_HERO_SLIDES.map(normalizeSlide);
    }
  });

  // 2. Sync to localStorage whenever slidesList changes and broadcast custom event
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.heroSlides, JSON.stringify(slidesList));
    } catch (e) {
      console.warn('Failed to sync hero slides to localStorage:', e);
    }
  }, [slidesList]);

  // 3. Multi-Tab Real-time Synchronizer (Storage event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === APP_CONFIG.storageKeys.heroSlides && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlidesList(parsed.map(normalizeSlide));
          }
        } catch (err) {
          console.warn('Error parsing updated hero slides from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 3. Real-time Firestore Cloud listener
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeToCloudHeroSlides(
      (cloudSlides) => {
        if (cloudSlides && cloudSlides.length > 0) {
          const existingCloudIds = new Set(cloudSlides.map((s) => String(s.id)));
          const missingDefaults = DEFAULT_HERO_SLIDES.filter(
            (s) => !existingCloudIds.has(String(s.id))
          );

          if (missingDefaults.length > 0) {
            const merged = [...cloudSlides.map(normalizeSlide), ...missingDefaults.map(normalizeSlide)];
            merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setSlidesList(merged);
            // Auto-persist missing default slides to Cloud Firestore
            missingDefaults.forEach((slide) => {
              saveHeroSlideToCloud(normalizeSlide(slide)).catch((err) =>
                console.warn(`Failed to auto-sync slide ${slide.id} to cloud:`, err)
              );
            });
          } else {
            setSlidesList(cloudSlides.map(normalizeSlide));
          }
        } else if (cloudSlides === null) {
          // Empty collection in Firestore, auto-seed defaults
          seedHeroSlidesToCloud(DEFAULT_HERO_SLIDES.map(normalizeSlide)).catch((err) => {
            console.warn('Auto-seed hero slides to Firestore failed:', err);
          });
        }
      },
      (error) => {
        console.warn('Falling back to local hero slides due to Firestore error:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 4. Memoized active slides for customer hero presentation
  const activeSlides = useMemo(() => {
    const activeOnly = slidesList.filter((s) => s.isActive !== false);
    return activeOnly.length > 0 ? activeOnly : DEFAULT_HERO_SLIDES;
  }, [slidesList]);

  // Admin Actions:
  const addSlide = useCallback(
    async (newSlide) => {
      const slideItem = normalizeSlide({
        id: newSlide.id || `slide-${Date.now()}`,
        badge: newSlide.badge || '✨ Pilihan Spesial',
        title: newSlide.title || 'Menu Favorit Beliyuk',
        subtitle: newSlide.subtitle || '',
        img: newSlide.img || '/images/hero_roti_bakar_3d.jpg',
        targetCategory: newSlide.targetCategory || 'all',
        colorTheme: newSlide.colorTheme,
        ctaText: newSlide.ctaText || 'Lihat Menu',
        floatingBadge: newSlide.floatingBadge || '',
        isActive: true,
        order: slidesList.length,
      });

      setSlidesList((prev) => [...prev, slideItem]);
      if (isFirebaseConfigured()) {
        await saveHeroSlideToCloud(slideItem);
      }
      return slideItem;
    },
    [slidesList.length]
  );

  const updateSlide = useCallback(async (slideId, updatedFields) => {
    let finalSlide = null;
    setSlidesList((prev) =>
      prev.map((s) => {
        if (s.id === slideId) {
          finalSlide = normalizeSlide({ ...s, ...updatedFields });
          return finalSlide;
        }
        return s;
      })
    );
    if (isFirebaseConfigured() && finalSlide) {
      await saveHeroSlideToCloud(finalSlide);
    }
  }, []);

  const deleteSlide = useCallback(async (slideId) => {
    setSlidesList((prev) => prev.filter((s) => s.id !== slideId));
    if (isFirebaseConfigured()) {
      await deleteHeroSlideFromCloud(slideId);
    }
  }, []);

  const toggleSlideActive = useCallback(async (slideId) => {
    let updatedSlide = null;
    setSlidesList((prev) =>
      prev.map((s) => {
        if (s.id === slideId) {
          updatedSlide = { ...s, isActive: !s.isActive };
          return updatedSlide;
        }
        return s;
      })
    );
    if (isFirebaseConfigured() && updatedSlide) {
      await saveHeroSlideToCloud(updatedSlide);
    }
  }, []);

  const moveSlide = useCallback(
    async (slideId, direction) => {
      const idx = slidesList.findIndex((s) => s.id === slideId);
      if (idx === -1) return;
      if (direction === 'up' && idx === 0) return;
      if (direction === 'down' && idx === slidesList.length - 1) return;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const reordered = [...slidesList];
      const temp = reordered[idx];
      reordered[idx] = reordered[targetIdx];
      reordered[targetIdx] = temp;

      const updated = reordered.map((s, i) => ({ ...s, order: i }));
      setSlidesList(updated);

      if (isFirebaseConfigured()) {
        await seedHeroSlidesToCloud(updated);
      }
    },
    [slidesList]
  );

  const resetSlidesToDefault = useCallback(async () => {
    const normalizedDefaults = DEFAULT_HERO_SLIDES.map(normalizeSlide);
    setSlidesList(normalizedDefaults);
    if (isFirebaseConfigured()) {
      await seedHeroSlidesToCloud(normalizedDefaults);
    }
  }, []);

  const syncSlidesToCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Konfigurasi Firebase belum terpasang!');
    }
    await seedHeroSlidesToCloud(slidesList);
    return true;
  }, [slidesList]);

  return {
    slidesList,
    activeSlides,
    addSlide,
    updateSlide,
    deleteSlide,
    toggleSlideActive,
    moveSlide,
    resetSlidesToDefault,
    syncSlidesToCloud,
  };
};
