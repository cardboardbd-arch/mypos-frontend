"use client";
import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import Link from "next/link";

interface Collection {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  featured_image?: string | null;
  cover_image?: string | null;
  banner?: string | null;
  product_count: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/collections`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setCollections(d.data ?? []))
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Collections</h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[4/3]" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-4">Failed to load collections.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No collections available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((c) => {
                const image = c.cover_image || c.featured_image || c.banner;
                return (
                  <Link key={c.id} href={`/collections/${c.slug}`}
                    className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                      {image ? (
                        <img src={image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <span className="text-4xl font-black text-gray-200">{c.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="font-black text-sm uppercase tracking-wide">{c.name}</p>
                      {c.short_description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.short_description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{c.product_count} {c.product_count === 1 ? "product" : "products"} →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
