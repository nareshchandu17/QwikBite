"use client";

import { create } from "zustand";

type MenuItemLike = { 
  id: string | number; 
  name: string; 
  price: number; 
  image?: string;
  category?: string;
  quantity?: number;
  [key: string]: any; 
};

type CartItem = { id: number; item: MenuItemLike; quantity: number };

type CartState = {
  items: CartItem[];
  addItem: (item: MenuItemLike, quantity?: number) => void;
  removeItem: (cartItemId: number) => void;
  updateItemQuantity: (itemId: number, quantity: number) => void;
  clear: () => void;
  clearCart: () => void;
  count: () => number;
  timeSlot: string | null;
  setTimeSlot: (id: string | null) => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  timeSlot: null,
  addItem: (item: MenuItemLike, quantity?: number) => {
    console.log('[Cart Store] addItem called with:', { item, quantity });
    set((state) => {
      console.log('[Cart Store] Current state items:', state.items);
      
      const qtyFromItem = typeof item.quantity === 'number' ? item.quantity : undefined;
      const qty = Math.max(1, Math.floor(quantity ?? qtyFromItem ?? 1));
      const existing = state.items.find((i) => i.item.id === item.id);
      
      console.log('[Cart Store] Item details:', { 
        itemId: item.id, 
        itemName: item.name, 
        quantity: qty, 
        existing: !!existing 
      });
      
      if (existing) {
        const newItems = state.items.map((it) =>
          it.item.id === item.id ? { ...it, quantity: it.quantity + qty } : it
        );
        console.log('[Cart Store] Updated existing item, new items:', newItems);
        return { items: newItems };
      }
      
      // Generate unique ID using timestamp + random number to prevent collisions
      const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
      const newItems = [...state.items, { id: uniqueId, item, quantity: qty }];
      console.log('[Cart Store] Added new item, new items:', newItems);
      return { items: newItems };
    });
  },
  removeItem: (cartItemId: number) => {
    set((state) => ({ items: state.items.filter((it) => it.id !== cartItemId) }));
  },
  updateItemQuantity: (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter((it) => it.id !== itemId) }));
    } else {
      set((state) => ({
        items: state.items.map((it) => (it.id === itemId ? { ...it, quantity } : it))
      }));
    }
  },
  clear: () => set({ items: [] }),
  clearCart: () => set({ items: [], timeSlot: null }),
  count: () => get().items.reduce((s, it) => s + it.quantity, 0),
  setTimeSlot: (id: string | null) => set({ timeSlot: id }),
}));
