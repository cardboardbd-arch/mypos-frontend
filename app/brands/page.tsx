"use client";
import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import Link from "next/link";

interface Brand { id: number; name: string; slug: string; }

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/brands`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setBrands(d.data ?? []))
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-6">All Brands</h1>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-square" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-4">Failed to load brands.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {brands.map((b) => (
                <Link key={b.id} href={`/shop?brand=${b.slug}`}
                  className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition group">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-black transition">
                    <span className="text-2xl font-black group-hover:text-white transition">{b.name.charAt(0)}</span>
                  </div>
                  <p className="font-black text-sm uppercase tracking-wide">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-1">View Products →</p>
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
