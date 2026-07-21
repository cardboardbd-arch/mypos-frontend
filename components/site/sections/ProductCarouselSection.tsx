"use client";

import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
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
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            thumbnail={p.thumbnail}
            price={p.variants?.[0]?.price ?? 0}
            compare_price={p.variants?.[0]?.compare_price}
            variantId={p.variants?.[0]?.id}
            sku={p.variants?.[0]?.sku}
            product_type={p.product_type}
          />
        ))}
      </div>
    </section>
  );
}

export default ProductCarouselSection;
