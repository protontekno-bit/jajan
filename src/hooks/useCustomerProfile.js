import { useState } from 'react';
import { APP_CONFIG } from '../config/constants.js';

const STORAGE_KEY = 'beliyuk_customer_profile_v1';

/**
 * Hook to manage persistent customer profile in localStorage.
 * Ensures customer doesn't have to retype name, phone, or address on repeat orders.
 */
export const useCustomerProfile = () => {
  const [profile, setProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse customer profile:', e);
    }
    return {
      name: '',
      phone: '',
      address: APP_CONFIG.storeAddress || 'Sangatta Utara, Kutai Timur',
    };
  });

  const updateProfile = (updates) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save profile to localStorage:', e);
      }
      return next;
    });
  };

  return {
    profile,
    updateProfile,
  };
};
