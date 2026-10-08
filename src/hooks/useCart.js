import { useState, useEffect, useCallback, useMemo } from 'react';
import { APP_CONFIG } from '../config/constants.js';

/**
 * Custom hook to manage shopping cart state with localStorage persistence.
 * Decouples business logic from presentation layer for AI-friendly testing and modification.
 */
export const useCart = () => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.storageKeys.cart);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.cart, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cart]);

  /**
   * Add a product to the cart or increment its quantity
   * @param {import('../types/index.js').Product} product
   */
  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const next = [...prevCart];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });

    setLastAddedItem(product);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  /**
   * Update quantity of an item in the cart
   * @param {number} productId
   * @param {number} newQuantity
   */
  const updateQuantity = useCallback((productId, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  /**
   * Remove item entirely from cart
   * @param {number} productId
   */
  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  /**
   * Clear the cart
   */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Derived calculations
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
    isAnimating,
    lastAddedItem,
  };
};
