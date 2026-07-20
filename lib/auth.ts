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
