'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface CartItem {
  itemId: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price_tzs: number;
  quantity: number;
  image_url: string | null;
}

interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  totalItems: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'shuleyetu_cart';

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCartToStorage(items);
  }, [items, hydrated]);

  const vendorId = items.length > 0 ? items[0].vendorId : null;
  const vendorName = items.length > 0 ? items[0].vendorName : null;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price_tzs * item.quantity, 0);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      // If cart has items from a different vendor, clear first
      if (prev.length > 0 && prev[0].vendorId !== newItem.vendorId) {
        const qty = newItem.quantity ?? 1;
        return [{ ...newItem, quantity: qty }];
      }
      const existing = prev.find((i) => i.itemId === newItem.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === newItem.itemId
            ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.itemId !== itemId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        vendorId,
        vendorName,
        totalItems,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
      }}
    >
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
