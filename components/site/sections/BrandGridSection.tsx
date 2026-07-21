"use client";

import Link from "next/link";
import type { RawHomepageSection, SectionBrandItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function BrandGridSection({ section }: Props) {
  const items = (section.items ?? []) as SectionBrandItem[];
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((b) => (
          <Link
            key={b.id}
            href={`/shop?brand=${b.slug}`}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 hover:border-black transition-colors p-5 text-center"
          >
            {b.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo} alt={b.name} className="h-10 w-full object-contain" />
            ) : (
              <span className="text-lg font-black uppercase tracking-tight text-gray-900">
                {b.name}
              </span>
            )}
            {typeof b.product_count === "number" && (
              <span className="text-[11px] text-gray-400">{b.product_count} products</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default BrandGridSection;
