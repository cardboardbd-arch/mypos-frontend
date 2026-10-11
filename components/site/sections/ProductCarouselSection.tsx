"use client";

import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import { legacyToColorOption } from "@/lib/product-adapters";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function ProductCarouselSection({ section }: Props) {
  const products = section.products ?? [];
  if (products.length === 0) return null;

  const layout = (section.config as Record<string, any>)?.layout ?? {};
  const columns = Number(layout.columns ?? 5);
  const rows = Number(layout.rows ?? 2);
  const maxProducts = columns * rows; // e.g. 5 columns * 2 rows = 10 products
  const displayProducts = products.slice(0, maxProducts);

  // Map columns to tailwind desktop grid classes
  const gridColsClass = matchColumns(columns);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>
          )}
        </div>
        {section.view_all_link && (
          <Link
            href={section.view_all_link}
            className="text-sm font-medium text-gray-500 hover:text-black transition shrink-0"
          >
            View All →
          </Link>
        )}
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-[10px]`}>
        {displayProducts.map((p) => {
          // WebsiteProductCardResource (HomepageService::homepageSections())
          // sends `title`, not the older ProductCardResource's `name` —
          // legacyToColorOption() only needs a display name, so it's
          // normalized here rather than widening that shared adapter.
          const displayName = p.title ?? p.name ?? "";
          return (
            <ProductCard
              key={p.id}
              title={displayName}
              colors={[legacyToColorOption({ ...p, name: displayName })]}
            />
          );
        })}
      </div>
    </section>
  );
}

function matchColumns(cols: number): string {
  switch (cols) {
    case 2:
      return "lg:grid-cols-2";
    case 3:
      return "lg:grid-cols-3";
    case 4:
      return "lg:grid-cols-4";
    case 6:
      return "lg:grid-cols-6";
    case 5:
    default:
      return "lg:grid-cols-5";
  }
}

export default ProductCarouselSection;
