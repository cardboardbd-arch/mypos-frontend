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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[10px]">
        {items.map((cat) => {
          const image = resolveMediaUrl(cat.image);
          return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow duration-300"
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
                className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300 bg-gradient-to-br from-gray-100 to-gray-200"
                style={cat.color ? { backgroundColor: cat.color, color: "#fff" } : undefined}
              >
                {cat.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
            <div className="absolute bottom-3 left-3">
              <span className="inline-block bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                {cat.name}
                {typeof cat.product_count === "number" && cat.product_count > 0 && (
                  <span className="text-gray-300 font-normal ml-1">({cat.product_count})</span>
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
