const BASE = process.env.NEXT_PUBLIC_API_URL;

function buildQs(
  params: Record<string, string | number | undefined> = {}
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(
      entries.map(([k, v]) => [k, String(v)]) as [string, string][]
    ).toString()
  );
}

export async function getProducts(
  params?: Record<string, string | number | undefined>
) {
  const res = await fetch(`${BASE}/v1/products${buildQs(params)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getProduct(slug: string) {
  const res = await fetch(`${BASE}/v1/products/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${BASE}/v1/categories`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCategory(slug: string) {
  const res = await fetch(`${BASE}/v1/categories/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getBrands() {
  const res = await fetch(`${BASE}/v1/brands`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getBrand(slug: string) {
  const res = await fetch(`${BASE}/v1/brands/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCollections() {
  const res = await fetch(`${BASE}/v1/collections`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCollection(slug: string) {
  const res = await fetch(`${BASE}/v1/collections/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCollectionProducts(slug: string) {
  const res = await fetch(`${BASE}/v1/collections/${encodeURIComponent(slug)}/products`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchProducts(
  q: string,
  params?: Record<string, string | number | undefined>
) {
  const qs = buildQs({ q, ...(params || {}) });
  const res = await fetch(`${BASE}/v1/search${qs}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
