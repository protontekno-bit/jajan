import { useState, useEffect, useCallback, useMemo } from 'react';
import { APP_CONFIG } from '../config/constants.js';

/**
 * Generates or retrieves unique item key considering product ID, selected variants, and toppings.
 */
export const getCartItemKey = (item) => {
  if (item.cartKey) return item.cartKey;
  const vStr = item.selectedVariants ? JSON.stringify(item.selectedVariants) : '';
  const tStr = Array.isArray(item.selectedToppings)
    ? item.selectedToppings.map((t) => t.id || t.name).sort().join(',')
    : '';
  return `${item.id}-${vStr}-${tStr}`;
};

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
   * Add a product to the cart or increment its quantity.
   * Accurately distinguishes identical products with different variants/toppings.
   * @param {import('../types/index.js').Product} product
   */
  const addToCart = useCallback((product) => {
    const targetKey = getCartItemKey(product);
    const addedQty = Number(product.quantity) || 1;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => getCartItemKey(item) === targetKey);
      if (existingIndex > -1) {
        const next = [...prevCart];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + addedQty,
        };
        return next;
      }
      return [...prevCart, { ...product, cartKey: targetKey, quantity: addedQty }];
    });

    setLastAddedItem(product);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  /**
   * Update quantity of an item in the cart by unique cartKey or fallback productId.
   * @param {string|number} targetKey
   * @param {number} newQuantity
   */
  const updateQuantity = useCallback((targetKey, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter(
          (item) => getCartItemKey(item) !== String(targetKey) && String(item.id) !== String(targetKey)
        );
      }
      return prevCart.map((item) => {
        const itemKey = getCartItemKey(item);
        if (itemKey === String(targetKey) || String(item.id) === String(targetKey)) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, []);

  /**
   * Remove item entirely from cart by unique cartKey or fallback productId.
   * @param {string|number} targetKey
   */
  const removeFromCart = useCallback((targetKey) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => getCartItemKey(item) !== String(targetKey) && String(item.id) !== String(targetKey)
      )
    );
  }, []);

  /**
   * Clear the cart
   */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /**
   * Validates cart items against the current live catalog.
   * Drops items that no longer exist or have been hidden (isActive === false).
   * Updates product metadata & price if changed in the catalog.
   */
  const validateCartAgainstCatalog = useCallback((catalogProducts) => {
    if (!Array.isArray(catalogProducts) || catalogProducts.length === 0) return;

    setCart((prevCart) => {
      let changed = false;
      const validItems = [];

      for (const item of prevCart) {
        const catalogItem = catalogProducts.find(
          (p) => String(p.id).trim() === String(item.id).trim()
        );

        // Jika item sudah dihapus permanen atau dinonaktifkan dari katalog
        if (!catalogItem || catalogItem.isActive === false) {
          changed = true;
          continue;
        }

        // Sinkronisasi data dasar produk
        if (
          catalogItem.name !== item.name ||
          catalogItem.img !== item.img ||
          (catalogItem.price !== item.basePrice && catalogItem.price !== item.price)
        ) {
          const extraPrice = Math.max(0, (item.price || 0) - (item.basePrice || catalogItem.price || 0));
          validItems.push({
            ...item,
            name: catalogItem.name,
            img: catalogItem.img,
            basePrice: catalogItem.price,
            price: catalogItem.price + extraPrice,
          });
          changed = true;
        } else {
          validItems.push(item);
        }
      }

      return changed ? validItems : prevCart;
    });
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
    validateCartAgainstCatalog,
  };
};
