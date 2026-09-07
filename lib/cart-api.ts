const BASE = process.env.NEXT_PUBLIC_API_URL;

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("cart_session_id");
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("cart_session_id", id);
  }
  return id;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function cartHeaders(): Record<string, string> {
  const headers = getAuthHeaders();
  const sessionId = getSessionId();
  if (sessionId) headers["X-Session-ID"] = sessionId;
  return headers;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnail?: string | null;
  };
  variant: {
    id: number;
    sku: string;
    price: number;
    image?: string | null;
    attributes?: Record<string, string>;
  };
  thumbnail?: string | null;
  line_total: number;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  total: number;
  count: number;
}

export async function getCartApi(): Promise<Cart> {
  const res = await fetch(`${BASE}/v1/cart`, {
    headers: cartHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addToCartApi(productId: number, variantId: number, quantity = 1): Promise<CartItem> {
  const res = await fetch(`${BASE}/v1/cart/items`, {
    method: "POST",
    headers: cartHeaders(),
    body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateCartItemApi(itemId: number, quantity: number): Promise<CartItem> {
  const res = await fetch(`${BASE}/v1/cart/items/${encodeURIComponent(String(itemId))}`, {
    method: "PUT",
    headers: cartHeaders(),
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function removeFromCartApi(itemId: number): Promise<void> {
  const res = await fetch(`${BASE}/v1/cart/items/${encodeURIComponent(String(itemId))}`, {
    method: "DELETE",
    headers: cartHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function clearCartApi(): Promise<void> {
  const res = await fetch(`${BASE}/v1/cart`, {
    method: "DELETE",
    headers: cartHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
