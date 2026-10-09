"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Banner {
  label: string;
  slug: string;
  image: string;
  link: string;
}

interface Props {
  banners?: Banner[];
}

export function CategoryBanner({ banners: bannersProp }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bannersProp && bannersProp.length > 0) {
      setBanners(bannersProp);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/cms/category-banners`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => { if (res.data) setBanners(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bannersProp]);

  if (!loading && banners.length === 0) return null;

  return (
    <section className="w-full py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 animate-pulse"
                style={{ aspectRatio: "3/4" }}
              />
            ))
          : banners.map((b, i) => (
              <Link
                key={i}
                href={b.link ? b.link.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/") : `/category/${b.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-gray-100"
                style={{ aspectRatio: "3/4" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image}
                  alt={b.label}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm">
                    {b.label}
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

export default CategoryBanner;
