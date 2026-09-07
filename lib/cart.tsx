"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import {
  CartItem as ApiCartItem,
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeFromCartApi,
  clearCartApi,
} from "./cart-api";
import { normalizeItemAttributes } from "./attributes";

// ─── Context cart item shape (camelCase) ─────────────────────────────────────

export interface CartItem {
  id: number;
  productId: number;
  variantId: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compare_price?: number;
  thumbnail?: string | null;
  quantity: number;
  attributes?: Record<string, string>;
  line_total: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: "SET"; items: CartItem[]; loading: boolean }
  | { type: "ADD"; item: CartItem }
  | { type: "UPSERT_ITEM"; item: CartItem }
  | { type: "SET_QTY"; variantId: number; quantity: number }
  | { type: "REMOVE"; variantId: number }
  | { type: "CLEAR" }
  | { type: "ERROR"; error: string };

const STORAGE_KEY = "pos_cart_items";

function loadStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function mapApiItem(api: ApiCartItem): CartItem {
  return {
    id: api.id,
    productId: api.product_id || (api.product?.id ?? 0),
    variantId: api.variant_id || (api.variant?.id ?? 0),
    name: api.product?.name ?? "Product",
    slug: api.product?.slug ?? "",
    sku: api.variant?.sku ?? "",
    price: Number(api.variant?.price) || 0,
    quantity: api.quantity,
    attributes: normalizeItemAttributes(api.variant?.attributes),
    line_total: api.line_total ?? (Number(api.variant?.price) || 0) * api.quantity,
  };
}

function mapToApiItem(item: Omit<CartItem, "line_total" | "name" | "slug" | "sku" | "price"> & {
  name: string;
  slug: string;
  sku: string;
  price: number;
}): Omit<CartItem, "line_total"> {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    price: item.price,
    quantity: item.quantity,
    attributes: item.attributes,
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET": {
      saveStoredCart(action.items);
      return { items: action.items, loading: action.loading, error: null };
    }
    case "ADD": {
      const exists = state.items.some((i) => i.variantId === action.item.variantId);
      const updated = exists
        ? state.items.map((i) =>
            i.variantId === action.item.variantId
              ? { ...i, quantity: i.quantity + action.item.quantity, line_total: (i.quantity + action.item.quantity) * i.price }
              : i
          )
        : [...state.items, action.item];
      saveStoredCart(updated);
      return {
        ...state,
        items: updated,
        loading: false,
        error: null,
      };
    }
    case "UPSERT_ITEM": {
      const exists = state.items.some((i) => i.variantId === action.item.variantId);
      const updated = exists
        ? state.items.map((i) =>
            i.variantId === action.item.variantId
              ? { ...action.item, quantity: action.item.quantity || i.quantity }
              : i
          )
        : [...state.items, action.item];
      saveStoredCart(updated);
      return {
        ...state,
        items: updated,
        loading: false,
        error: null,
      };
    }
    case "SET_QTY": {
      const updated = action.quantity < 1
        ? state.items.filter((i) => i.variantId !== action.variantId)
        : state.items.map((i) =>
            i.variantId === action.variantId
              ? { ...i, quantity: action.quantity, line_total: action.quantity * i.price }
              : i
          );
      saveStoredCart(updated);
      return {
        ...state,
        items: updated,
      };
    }
    case "REMOVE": {
      const updated = state.items.filter((i) => i.variantId !== action.variantId);
      saveStoredCart(updated);
      return { ...state, items: updated };
    }
    case "CLEAR": {
      saveStoredCart([]);
      return { ...state, items: [] };
    }
    case "ERROR":
      return { ...state, error: action.error };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "line_total" | "name" | "slug" | "sku" | "price"> & {
    name: string;
    slug: string;
    sku: string;
    price: number;
  }, qty?: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  updateQuantity: (variantId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loading: true, error: null });

  const refreshCart = async () => {
    try {
      const cart = await getCartApi();
      const serverItems = cart?.items?.map(mapApiItem) ?? [];
      if (serverItems.length > 0) {
        dispatch({
          type: "SET",
          items: serverItems,
          loading: false,
        });
      } else {
        const local = loadStoredCart();
        dispatch({
          type: "SET",
          items: local,
          loading: false,
        });
      }
    } catch (err: any) {
      console.warn("Could not sync cart from API, using local cart:", err);
      const local = loadStoredCart();
      dispatch({ type: "SET", items: local, loading: false });
    }
  };

  const addToCart = async (item: any, qty = 1) => {
    const optimistic: CartItem = {
      ...item,
      quantity: qty,
      line_total: item.price * qty,
    };
    dispatch({ type: "ADD", item: optimistic });
    try {
      const apiItem = await addToCartApi(item.productId, item.variantId, qty);
      dispatch({ type: "UPSERT_ITEM", item: mapApiItem(apiItem) });
    } catch (err: any) {
      console.warn("Failed to sync item to cart API, keeping optimistic item:", err);
      // Keep optimistic item in local cart!
    }
  };

  const updateQuantity = async (variantId: number, qty: number) => {
    dispatch({ type: "SET_QTY", variantId, quantity: qty });
    try {
      const currentItems = loadStoredCart();
      const item = currentItems.find((i) => i.variantId === variantId);
      if (item && item.id) {
        const updated = await updateCartItemApi(item.id, qty);
        dispatch({ type: "UPSERT_ITEM", item: mapApiItem(updated) });
      }
    } catch (err: any) {
      console.warn("Failed to update quantity on API:", err);
    }
  };

  const removeFromCart = async (variantId: number) => {
    const currentItems = loadStoredCart();
    const item = currentItems.find((i) => i.variantId === variantId);
    dispatch({ type: "REMOVE", variantId });
    try {
      if (item && item.id) {
        await removeFromCartApi(item.id);
      }
    } catch (err: any) {
      console.warn("Failed to remove item on API:", err);
    }
  };

  const clearCart = async () => {
    dispatch({ type: "CLEAR" });
    try {
      await clearCartApi();
    } catch (err: any) {
      console.warn("Failed to clear cart on API:", err);
    }
  };

  useEffect(() => {
    const stored = loadStoredCart();
    if (stored.length > 0) {
      dispatch({ type: "SET", items: stored, loading: false });
    }
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cartCount,
        cartTotal,
        loading: state.loading,
        error: state.error,
        refreshCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
