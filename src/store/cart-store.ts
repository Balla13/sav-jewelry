import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Snapshot para exibir no carrinho produtos que vêm do Supabase (id UUID). */
export type CartItemSnapshot = {
  name: string;
  priceUsd: number;
  image: string;
  /** Frete grátis para este produto. */
  freeShipping?: boolean;
};

export interface CartItem {
  productId: string;
  quantity: number;
  /** Preenchido ao adicionar da página do produto (Supabase); usado para exibir no carrinho. */
  snapshot?: CartItemSnapshot;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (productId: string, quantity?: number, snapshot?: CartItemSnapshot) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (productId, quantity = 1, snapshot) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          const newItem: CartItem = { productId, quantity, snapshot };
          const items = existing
            ? state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + quantity, snapshot: snapshot ?? i.snapshot }
                  : i
              )
            : [...state.items, newItem];
          return { items };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [], isOpen: false }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    { name: "jewelry-cart", partialize: (s) => ({ items: s.items }) }
  )
);
