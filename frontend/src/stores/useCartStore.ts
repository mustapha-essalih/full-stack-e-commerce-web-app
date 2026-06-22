import { create } from 'zustand';
import type { Cart, CartItem } from '../api/cart';
import * as cartApi from '../api/cart';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  isDrawerOpen: boolean;

  setCart: (cart: Cart) => void;
  syncWithServer: () => Promise<void>;

  addItem: (productId: number, quantity: number, product: CartItem['product']) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  isDrawerOpen: false,

  setCart: (cart: Cart) => {
    set({
      items: cart.items,
      total: cart.total_cents,
      itemCount: cart.item_count,
    });
  },

  syncWithServer: async () => {
    try {
      set({ isLoading: true });
      const cart = await cartApi.fetchCart();
      get().setCart(cart);
    } catch {
      // silently fail — cart isn't essential for browsing
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: number, quantity: number, product: CartItem['product']) => {
    const previous = { items: get().items, total: get().total, itemCount: get().itemCount };

    const existingIndex = get().items.findIndex((i) => i.product_id === productId);
    let optimisticItems: CartItem[];

    if (existingIndex >= 0) {
      optimisticItems = get().items.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity, subtotal_cents: (item.quantity + quantity) * item.unit_price_cents }
          : item,
      );
    } else {
      const newItem: CartItem = {
        id: -Date.now(),
        product_id: productId,
        product,
        quantity,
        unit_price_cents: product.price_cents,
        subtotal_cents: quantity * product.price_cents,
      };
      optimisticItems = [...get().items, newItem];
    }

    const optimisticTotal = optimisticItems.reduce((sum, i) => sum + i.subtotal_cents, 0);
    const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);

    set({ items: optimisticItems, total: optimisticTotal, itemCount: optimisticCount });

    try {
      const result = await cartApi.addCartItem(productId, quantity);
      get().setCart(result.cart);
    } catch {
      set(previous);
      throw new Error('Failed to add item to cart.');
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    const previous = { items: get().items, total: get().total, itemCount: get().itemCount };

    const optimisticItems = get().items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, subtotal_cents: quantity * item.unit_price_cents }
        : item,
    );
    const optimisticTotal = optimisticItems.reduce((sum, i) => sum + i.subtotal_cents, 0);
    const optimisticCount = optimisticItems.reduce((sum, i) => sum + i.quantity, 0);

    set({ items: optimisticItems, total: optimisticTotal, itemCount: optimisticCount });

    try {
      const cart = await cartApi.updateCartItemQuantity(itemId, quantity);
      get().setCart(cart);
    } catch {
      set(previous);
      throw new Error('Failed to update quantity.');
    }
  },

  removeItem: async (itemId: number) => {
    const previous = { items: get().items, total: get().total, itemCount: get().itemCount };

    set({
      items: get().items.filter((i) => i.id !== itemId),
      total: get().items
        .filter((i) => i.id !== itemId)
        .reduce((sum, i) => sum + i.subtotal_cents, 0),
      itemCount: get().items
        .filter((i) => i.id !== itemId)
        .reduce((sum, i) => sum + i.quantity, 0),
    });

    try {
      const cart = await cartApi.removeCartItem(itemId);
      get().setCart(cart);
    } catch {
      set(previous);
      throw new Error('Failed to remove item.');
    }
  },

  clearCart: async () => {
    const previous = { items: get().items, total: get().total, itemCount: get().itemCount };
    set({ items: [], total: 0, itemCount: 0 });

    try {
      const cart = await cartApi.clearCart();
      get().setCart(cart);
    } catch {
      set(previous);
      throw new Error('Failed to clear cart.');
    }
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),

  resetCart: () => {
    set({
      items: [],
      total: 0,
      itemCount: 0,
    });
  },
}));
