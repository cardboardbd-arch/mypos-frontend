const BASE = process.env.NEXT_PUBLIC_API_URL;

function parseApiError(res: Response, fallback: string): Error {
  return new Error(`${fallback} (HTTP ${res.status})`);
}

export async function registerCustomer(data: {
  name: string;
  phone: string;
  password: string;
  email?: string;
}) {
  const res = await fetch(`${BASE}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw parseApiError(res, "Registration failed");
  return res.json();
}

export async function loginCustomer(data: { phone: string; password: string }) {
  const res = await fetch(`${BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw parseApiError(res, "Login failed");
  return res.json();
}

export async function logoutCustomer(token: string) {
  const res = await fetch(`${BASE}/v1/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw parseApiError(res, "Logout failed");
  return res.json();
}

export async function getProfile(token: string) {
  const res = await fetch(`${BASE}/v1/auth/profile`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw parseApiError(res, "Failed to load profile");
  return res.json();
}

export async function getMyOrders(token: string) {
  const res = await fetch(`${BASE}/v1/orders`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw parseApiError(res, "Failed to load orders");
  return res.json();
}

export async function updateProfile(token: string, data: { name?: string; email?: string; address?: string }) {
  const res = await fetch(`${BASE}/v1/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw parseApiError(res, "Failed to update profile");
  return res.json();
}

export async function getOrderDetail(token: string, orderNumber: string) {
  const res = await fetch(`${BASE}/v1/customer/orders/${encodeURIComponent(orderNumber)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw parseApiError(res, "Order not found");
  return res.json();
}

export async function cancelOrder(token: string, orderNumber: string, reason?: string) {
  const res = await fetch(`${BASE}/v1/customer/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Could not cancel this order (HTTP ${res.status})`);
  return data;
}

export interface CustomerAddress {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  area: string | null;
  city: string | null;
  postal_code: string | null;
  is_default: boolean;
}

export async function getAddresses(token: string): Promise<{ data: CustomerAddress[] }> {
  const res = await fetch(`${BASE}/v1/auth/addresses`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw parseApiError(res, "Failed to load addresses");
  return res.json();
}

export async function createAddress(token: string, data: Omit<CustomerAddress, "id" | "is_default"> & { is_default?: boolean }) {
  const res = await fetch(`${BASE}/v1/auth/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw parseApiError(res, "Failed to save address");
  return res.json();
}

export async function updateAddress(token: string, id: number, data: Partial<Omit<CustomerAddress, "id">>) {
  const res = await fetch(`${BASE}/v1/auth/addresses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw parseApiError(res, "Failed to update address");
  return res.json();
}

export async function deleteAddress(token: string, id: number) {
  const res = await fetch(`${BASE}/v1/auth/addresses/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw parseApiError(res, "Failed to delete address");
  return res.json();
}

export async function setDefaultAddress(token: string, id: number) {
  const res = await fetch(`${BASE}/v1/auth/addresses/${id}/default`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw parseApiError(res, "Failed to set default address");
  return res.json();
}

export function saveToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}
export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}
