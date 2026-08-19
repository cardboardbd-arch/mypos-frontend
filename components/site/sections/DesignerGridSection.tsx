"use client";

import Link from "next/link";
import { ProductCardSmall } from "@/components/site/ProductCardSmall";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function DesignerGridSection({ section }: Props) {
  const products = section.products ?? [];
  const config = (section.config ?? {}) as Record<string, any>;
  const image = resolveMediaUrl(section.image) ?? resolveMediaUrl(config.banner_image);
  const buttonText = section.button_text || config.button_text || "Shop Now →";
  const viewAllLink = section.view_all_link || (section.category_slug ? `/shop?category=${section.category_slug}` : "/shop");

  if (products.length === 0 && !image) {
    return null;
  }

  // Display up to 8 products in the right side grid
  const displayProducts = products.slice(0, 8);

  return (
    <section className="w-full py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm font-bold text-gray-500 hover:text-black transition"
          >
            View All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-[8px]">
        {/* Left Big Promo Banner */}
        {image && (
          <Link
            href={viewAllLink}
            className="hidden md:block group relative overflow-hidden rounded-xl bg-gray-200 md:col-span-2 md:row-span-2 min-h-[340px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={section.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute bottom-5 left-4 right-4">
              <p className="text-white font-black text-base uppercase tracking-wide leading-tight">
                {section.title}
              </p>
              {section.subtitle && (
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{section.subtitle}</p>
              )}
              <span className="inline-block mt-2.5 text-[10px] font-black uppercase tracking-widest bg-white text-black px-3.5 py-1.5 rounded-sm">
                {buttonText}
              </span>
            </div>
          </Link>
        )}

        {/* Right Product Grid */}
        <div className={`col-span-2 ${image ? "md:col-span-4" : "md:col-span-6"} grid grid-cols-2 md:grid-cols-4 gap-[8px]`}>
          {displayProducts.map((p: any, idx) => {
            const isLast = idx === displayProducts.length - 1 && displayProducts.length >= 4;
            const price = typeof p.price === "number" ? p.price : (p.variants?.[0]?.price ?? p.selling_price ?? 0);
            const comparePrice = typeof p.compare_price === "number" ? p.compare_price : p.variants?.[0]?.compare_price;
            const thumb = resolveMediaUrl(p.thumbnail ?? p.primary_image ?? p.image);

            return (
              <div key={p.id ?? idx} className="relative">
                <ProductCardSmall
                  id={p.id}
                  name={p.title ?? p.name}
                  slug={p.slug}
                  thumbnail={thumb}
                  price={price}
                  compare_price={comparePrice}
                />
                {isLast && viewAllLink && (
                  <Link
                    href={viewAllLink}
                    className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-black/85 transition z-10 p-2"
                  >
                    <span className="text-white font-black text-sm uppercase tracking-widest text-center leading-tight">
                      VIEW<br />MORE
                    </span>
                    <span className="text-[10px] text-white/80 font-bold">→</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default DesignerGridSection;
