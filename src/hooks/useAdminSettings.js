import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants.js';

const DEFAULT_SETTINGS = {
  storeName: APP_CONFIG.name,
  whatsappNumber: APP_CONFIG.whatsappNumber,
  storeHours: APP_CONFIG.storeHours,
  storeAddress: APP_CONFIG.storeAddress,
  storeCoordinatesStr: APP_CONFIG.storeCoordinatesStr,
  storeMapsUrl: APP_CONFIG.storeMapsUrl,
  deliveryFee: APP_CONFIG.deliveryFee,
  freeDeliveryThreshold: APP_CONFIG.freeDeliveryThreshold,
};

/**
 * Custom hook to manage store owner settings persisted in localStorage.
 */
export const useAdminSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.settings);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.settings, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to sync settings to localStorage:', e);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
