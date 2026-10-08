import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants.js';

/**
 * Custom hook to manage customer order history stored in local device storage.
 * Starts with an authentic empty list [] for real users.
 */
export const useOrders = () => {
  const [orders, setOrders] = useState(() => {
    try {
      // 1. Purge legacy demo key from previous developer testing
      if (typeof window !== 'undefined') {
        localStorage.removeItem('beliyuk_orders_v1');
      }

      const saved = localStorage.getItem(APP_CONFIG.storageKeys.orders);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // Filter out any legacy mock orders like BJ-202610-01
      return parsed.filter(
        (o) => o && o.id !== 'BJ-202610-01' && o.customerName !== 'Siti Rahma'
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.orders, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to sync orders to localStorage:', e);
    }
  }, [orders]);

  const addOrder = useCallback((orderData) => {
    const uniqueId = `BJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newOrder = {
      id: orderData.id || uniqueId,
      date: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      ...orderData,
      status: orderData.status || 'Pesanan Baru 🔔',
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const clearOrders = useCallback(() => {
    setOrders([]);
    try {
      localStorage.removeItem(APP_CONFIG.storageKeys.orders);
      localStorage.removeItem('beliyuk_orders_v1');
    } catch (e) {
      console.warn('Failed to clear orders from storage:', e);
    }
  }, []);

  return {
    orders,
    addOrder,
    clearOrders,
  };
};
