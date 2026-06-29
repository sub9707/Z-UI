import { create } from "zustand";
import { zui } from "@z-ui/core";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  coupon: string | null;
  discountRate: number;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyCoupon: (code: string) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>(
  zui({ name: "cartStore" })((set, get) => ({
    items: [],
    coupon: null,
    discountRate: 0,
    addItem: (item) =>
      set((s) => {
        const existing = s.items.find((i) => i.id === item.id);
        if (existing) {
          return {
            items: s.items.map((i) =>
              i.id === item.id ? { ...i, qty: i.qty + 1 } : i
            ),
          };
        }
        return { items: [...s.items, { ...item, qty: 1 }] };
      }),
    removeItem: (id) =>
      set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    updateQty: (id, qty) =>
      set((s) => ({
        items:
          qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
      })),
    applyCoupon: (code) => {
      const discounts: Record<string, number> = { SAVE10: 0.1, SAVE20: 0.2 };
      const rate = discounts[code.toUpperCase()] ?? 0;
      set({ coupon: code, discountRate: rate });
    },
    clearCart: () => set({ items: [], coupon: null, discountRate: 0 }),
    total: () => {
      const { items, discountRate } = get();
      const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      return subtotal * (1 - discountRate);
    },
  }))
);
