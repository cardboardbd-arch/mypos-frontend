"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Store {
  name: string;
  area: string;
  address: string;
  phone: string;
  map_link?: string | null;
}

interface Props {
  stores?: Store[];
}

export function FindUs({ stores: storesProp }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storesProp && storesProp.length > 0) {
      setStores(storesProp);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/cms/stores`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => { if (res.data) setStores(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storesProp]);

  if (!loading && stores.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight">Find Us</h2>
        <Link href="/stores" className="text-sm font-medium text-gray-500 hover:text-black transition">View All →</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[10px]">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-full mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          : stores.map((store, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 text-lg">📍</div>
                <p className="font-black text-sm text-gray-900">{store.name}</p>
                <p className="text-xs text-gray-400 mt-1">{store.area}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{store.address}</p>
                <p className="text-xs font-bold text-black mt-2">{store.phone}</p>
              </div>
            ))}
      </div>
    </section>
  );
}

export default FindUs;
