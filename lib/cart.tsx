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
  | { type: "SET_QTY"; variantId: number; quantity: number }
  | { type: "REMOVE"; variantId: number }
  | { type: "CLEAR" }
  | { type: "ERROR"; error: string };

function mapApiItem(api: ApiCartItem): CartItem {
  return {
    id: api.id,
    productId: api.product_id,
    variantId: api.variant_id,
    name: api.product.name,
    slug: api.product.slug,
    sku: api.variant.sku,
    price: api.variant.price,
    quantity: api.quantity,
    attributes: api.variant.attributes,
    line_total: api.line_total,
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
    case "SET":
      return { items: action.items, loading: action.loading, error: null };
    case "ADD":
      return {
        ...state,
        items: state.items.find((i) => i.variantId === action.item.variantId)
          ? state.items.map((i) =>
              i.variantId === action.item.variantId
                ? { ...i, quantity: i.quantity + action.item.quantity }
                : i
            )
          : [...state.items, action.item],
      };
    case "SET_QTY":
      if (action.quantity < 1)
        return { ...state, items: state.items.filter((i) => i.variantId !== action.variantId) };
      return {
        ...state,
        items: state.items.map((i) =>
          i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.variantId !== action.variantId) };
    case "CLEAR":
      return { ...state, items: [] };
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
      dispatch({
        type: "SET",
        items: cart.items.map(mapApiItem),
        loading: false,
      });
    } catch (err: any) {
      dispatch({ type: "ERROR", error: err.message || "Failed to load cart" });
      dispatch({ type: "SET", items: [], loading: false });
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
      dispatch({ type: "SET", items: state.items.map((i) => (i.variantId === apiItem.variant_id ? mapApiItem(apiItem) : i)), loading: false });
    } catch (err: any) {
      dispatch({ type: "ERROR", error: err.message || "Failed to add item" });
      dispatch({ type: "SET_QTY", variantId: item.variantId, quantity: Math.max(1, (state.items.find((i) => i.variantId === item.variantId)?.quantity || 1) - qty) });
    }
  };

  const updateQuantity = async (variantId: number, qty: number) => {
    dispatch({ type: "SET_QTY", variantId, quantity: qty });
    try {
      const item = state.items.find((i) => i.variantId === variantId);
      if (item) {
        const updated = await updateCartItemApi(item.id, qty);
        dispatch({ type: "SET", items: state.items.map((i) => (i.id === updated.id ? mapApiItem(updated) : i)), loading: false });
      }
    } catch (err: any) {
      dispatch({ type: "ERROR", error: err.message || "Failed to update quantity" });
      dispatch({ type: "SET_QTY", variantId, quantity: state.items.find((i) => i.variantId === variantId)?.quantity || 1 });
    }
  };

  const removeFromCart = async (variantId: number) => {
    dispatch({ type: "REMOVE", variantId });
    try {
      const item = state.items.find((i) => i.variantId === variantId);
      if (item) {
        await removeFromCartApi(item.id);
      }
    } catch (err: any) {
      dispatch({ type: "ERROR", error: err.message || "Failed to remove item" });
    }
  };

  const clearCart = async () => {
    dispatch({ type: "CLEAR" });
    try {
      await clearCartApi();
    } catch (err: any) {
      dispatch({ type: "ERROR", error: err.message || "Failed to clear cart" });
    }
  };

  useEffect(() => {
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
