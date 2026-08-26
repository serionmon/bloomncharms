'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/content/products';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  alt: string;
  quantity: number;
  stock: number;
  subtitle?: string;
  isCustomizable?: boolean;
}

interface CartContextType {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (product: Product | CartItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  isInCart: (productId: string) => boolean;
  toast: { visible: boolean; message: string; productName?: string };
  hideToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bloomncharms_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; productName?: string }>({
    visible: false,
    message: '',
  });

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cart from storage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage whenever items change after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  }, [items, isHydrated]);

  const showNotification = useCallback((message: string, productName?: string) => {
    setToast({ visible: true, message, productName });
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const addItem = useCallback(
    (product: Product | CartItem, quantity: number = 1) => {
      const qtyToAdd = Math.max(1, quantity);
      const id = 'id' in product ? product.id : (product as CartItem).productId;

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.productId === id);
        const maxStock = product.stock || 99;

        if (existingIndex > -1) {
          const existing = prevItems[existingIndex];
          const newQty = Math.min(maxStock, existing.quantity + qtyToAdd);
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
          };
          return updated;
        } else {
          const newItem: CartItem = {
            productId: id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            price: product.price,
            currency: product.currency || '₹',
            image: product.image,
            alt: product.alt || product.name,
            quantity: Math.min(maxStock, qtyToAdd),
            stock: maxStock,
            subtitle: product.subtitle,
            isCustomizable: product.isCustomizable,
          };
          return [...prevItems, newItem];
        }
      });

      showNotification('Added to your bag', product.name);
    },
    [showNotification]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const incrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const nextQty = item.quantity + 1;
          return {
            ...item,
            quantity: item.stock ? Math.min(item.stock, nextQty) : nextQty,
          };
        }
        return item;
      })
    );
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: Math.max(1, item.quantity - 1),
          };
        }
        return item;
      })
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const safeQty = Math.max(1, item.stock ? Math.min(item.stock, quantity) : quantity);
          return {
            ...item,
            quantity: safeQty,
          };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const isInCart = useCallback(
    (productId: string) => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const contextValue = useMemo(
    () => ({
      items,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getSubtotal,
      isInCart,
      toast,
      hideToast,
    }),
    [
      items,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getSubtotal,
      isInCart,
      toast,
      hideToast,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
