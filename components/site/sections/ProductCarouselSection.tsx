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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[10px]">
        {products.map((p) => (
          // This section still sources from the OLD ProductCardResource
          // shape (backend WP4/WP5 didn't touch CMS product sections) —
          // legacyToColorOption() wraps it as a single, selector-less
          // card entry so it renders exactly as before.
          <ProductCard key={p.id} title={p.name} colors={[legacyToColorOption(p)]} />
        ))}
      </div>
    </section>
  );
}

export default ProductCarouselSection;
