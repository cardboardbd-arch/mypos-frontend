"use client";

import Link from "next/link";
import type { RawHomepageSection, SectionCollectionItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function CollectionGridSection({ section }: Props) {
  const items = (section.items ?? []) as SectionCollectionItem[];
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((c) => {
          const image = c.cover_image ?? c.featured_image ?? c.banner;
          return (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="group block rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-5xl font-black text-gray-300">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold text-sm uppercase tracking-tight text-gray-900">{c.name}</p>
                {typeof c.product_count === "number" && (
                  <p className="text-xs text-gray-400 mt-1">{c.product_count} products →</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default CollectionGridSection;
