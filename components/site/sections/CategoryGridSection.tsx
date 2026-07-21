"use client";

import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection, SectionCategoryItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function CategoryGridSection({ section }: Props) {
  const items = (section.items ?? []) as SectionCategoryItem[];
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
          {section.title}
        </h2>
        {section.view_all_link && (
          <Link
            href={section.view_all_link}
            className="text-sm font-medium text-gray-500 hover:text-black transition"
          >
            View All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
        {items.map((cat) => {
          const image = resolveMediaUrl(cat.image);
          return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300"
                style={cat.color ? { backgroundColor: cat.color, color: "#fff" } : undefined}
              >
                {cat.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition-colors" />
            <div className="absolute bottom-2 left-2 right-2">
              <span className="block bg-white/95 text-black text-[11px] font-bold text-center px-2 py-1.5 rounded-lg truncate">
                {cat.name}
                {typeof cat.product_count === "number" && (
                  <span className="text-gray-400 font-medium"> ({cat.product_count})</span>
                )}
              </span>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryGridSection;
