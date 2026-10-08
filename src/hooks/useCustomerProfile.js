import { useState, useEffect } from 'react';

const STORAGE_KEY = 'beliyuk_customer_profile_v1';
const SYNC_EVENT = 'beliyuk_customer_profile_sync';

/**
 * Hook to manage persistent customer profile in localStorage.
 * Features real-time multi-component synchronization via CustomEvent.
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
      address: '',
    };
  });

  // Real-time synchronization across Cart, Profile View, and other components
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) {
        setProfileState(e.detail);
      }
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const updateProfile = (updates) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: next }));
        }
      } catch (e) {
        console.warn('Failed to save profile to localStorage:', e);
      }
      return next;
    });
  };

  const clearProfile = () => {
    const blank = { name: '', phone: '', address: '' };
    setProfileState(blank);
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: blank }));
      }
    } catch (e) {
      console.warn('Failed to clear profile from localStorage:', e);
    }
  };

  return {
    profile,
    updateProfile,
    clearProfile,
  };
};
