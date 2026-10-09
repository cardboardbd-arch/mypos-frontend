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

  const rawViewAll = section.view_all_link
    ? section.view_all_link.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/")
    : null;
  const viewAllLink = rawViewAll || (section.category_slug ? `/category/${section.category_slug}` : undefined);

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
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm font-medium text-gray-500 hover:text-black transition shrink-0"
          >
            View All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[10px]">
        {products.map((p) => {
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

export default ProductCarouselSection;
