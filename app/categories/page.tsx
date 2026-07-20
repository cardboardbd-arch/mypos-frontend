"use client";
import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import Link from "next/link";

const FALLBACK_IMAGES: Record<string, string> = {
  "mens-fashion": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
  "womens-fashion": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  "electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
  "footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "accessories": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
};

interface Category { id: number; name: string; slug: string; image?: string | null; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/categories`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setCats(d.data ?? []))
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6">All Categories</h1>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-square" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-4">Failed to load categories.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cats.map((c) => (
                <Link key={c.id} href={`/shop?category=${c.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-lg transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image ?? FALLBACK_IMAGES[c.slug] ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80"}
                    alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white text-black text-xs font-black uppercase tracking-widest px-3 py-1.5">{c.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
