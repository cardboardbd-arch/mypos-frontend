"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Cat {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
}

const FALLBACK_IMAGES: Record<string, string> = {
  "mens-fashion":
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
  "womens-fashion":
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
  "electronics":
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
  "home-living":
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
  "sports-outdoors":
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
};

interface Props {
  categories?: Cat[];
}

export function Categories({ categories: categoriesProp }: Props) {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoriesProp && categoriesProp.length > 0) {
      setCategories(categoriesProp);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/categories`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => setCategories(data.data ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [categoriesProp]);

  if (loading) {
    return (
      <section className="w-full">
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Shop By Category
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[16/10] rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-center mb-8">
        <h2 className="text-xl font-bold uppercase tracking-tight">
          Shop By Category
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
        {categories.map((cat, i) => {
          const img = cat.image ?? FALLBACK_IMAGES[cat.slug];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                href={`/shop?category=${cat.slug}`}
                className="group block relative aspect-[16/10] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-gray-200 group-hover:to-gray-300 transition-colors duration-300" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-3 left-3">
                  <span className="inline-block bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    {cat.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default Categories;
