"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

interface Product {
  id: number;
  name: string;
  slug: string;
  thumbnail?: string | null;
  product_type: string;
  variants?: { id: number; sku: string; price: number; compare_price?: number }[];
}

interface Props {
  products?: Product[];
}

export function SignatureProducts({ products: productsProp }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productsProp && productsProp.length > 0) {
      setProducts(productsProp);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/products?featured=1&per_page=10`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        const items: Product[] = d.data ?? [];
        if (items.length === 0) {
          return fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/products?per_page=10`, {
            headers: { Accept: "application/json" },
          })
            .then((r) => r.json())
            .then((d2) => setProducts((d2.data as Product[]) ?? []));
        }
        setProducts(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productsProp]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full py-6">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
          Signature Product
        </h2>
        <Link
          href="/shop?featured=1"
          className="text-sm font-medium text-gray-500 hover:text-black transition"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[10px]">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-2 bg-gray-100 rounded w-3/4 mx-auto" />
                  <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
                  <div className="h-7 bg-gray-100 rounded mt-2" />
                </div>
              </div>
            ))
          : products.slice(0, 10).map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                thumbnail={p.thumbnail}
                price={p.variants?.[0]?.price ?? 0}
                compare_price={p.variants?.[0]?.compare_price}
                variantId={p.variants?.[0]?.id}
                sku={p.variants?.[0]?.sku}
                product_type={p.product_type}
              />
            ))}
      </div>
    </section>
  );
}

export default SignatureProducts;
