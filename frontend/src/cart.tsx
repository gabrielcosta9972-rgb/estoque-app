import React, { createContext, useContext, useState, useCallback } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit?: "kg" | "un";
  category?: string;
};

type CartState = {
  store: string | null;
  storeLabel: string | null;
  items: CartItem[];
  setStore: (id: string, label: string) => void;
  addOrUpdate: (item: CartItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalCount: number;
};

const CartContext = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [store, setStoreId] = useState<string | null>(null);
  const [storeLabel, setStoreLabel] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const setStore = useCallback((id: string, label: string) => {
    setStoreId((prev: string | null) => {
      if (prev !== id) setItems([]);
      return id;
    });
    setStoreLabel(label);
  }, []);

  const addOrUpdate = useCallback((item: CartItem) => {
    setItems((prev: CartItem[]) => {
      const idx = prev.findIndex((i: CartItem) => i.product_id === item.product_id);
      if (item.quantity <= 0) {
        if (idx === -1) return prev;
        return prev.filter((i: CartItem) => i.product_id !== item.product_id);
      }
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev: CartItem[]) => prev.filter((i: CartItem) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setStoreId(null);
    setStoreLabel(null);
  }, []);

  const totalCount = items.reduce((acc: number, i: CartItem) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ store, storeLabel, items, setStore, addOrUpdate, remove, clear, totalCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
