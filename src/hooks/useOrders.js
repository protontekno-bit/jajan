import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants.js';

const INITIAL_DEMO_ORDERS = [
  {
    id: 'BJ-202610-01',
    date: 'Hari ini, 19:30 WITA',
    customerName: 'Siti Rahma',
    orderType: 'delivery',
    address: 'G house no.151 Swarga Bara, Sangatta Utara (75683)',
    items: [
      { id: 3, name: 'Roti Bakar Nutella - Chocomaltine', quantity: 1, price: 30000 },
      { id: 12, name: 'Es Cokelat Lumer Segar', quantity: 1, price: 15000 },
    ],
    total: 45000,
    status: 'Pesanan Terkirim ke WhatsApp',
  },
];

/**
 * Custom hook to manage order history stored in localStorage.
 */
export const useOrders = () => {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.orders);
      return saved ? JSON.parse(saved) : INITIAL_DEMO_ORDERS;
    } catch {
      return INITIAL_DEMO_ORDERS;
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
    const newOrder = {
      id: `BJ-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      ...orderData,
      status: 'Pesanan Terkirim ke WhatsApp',
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  return {
    orders,
    addOrder,
  };
};
