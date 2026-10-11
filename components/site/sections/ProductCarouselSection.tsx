"use client";

import { useRef } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/site/ProductCard";
import { legacyToColorOption } from "@/lib/product-adapters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function ProductCarouselSection({ section }: Props) {
  const products = section.products ?? [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Slider Arrows */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={scrollLeft}
              aria-label="Previous products"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-black hover:text-white transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              aria-label="Next products"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-black hover:text-white transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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
      </div>

      {/* Horizontal Sliding Products Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-[10px] overflow-x-auto scroll-smooth pb-3 no-scrollbar scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p) => {
          const displayName = p.title ?? p.name ?? "";
          return (
            <div
              key={p.id}
              className="w-[calc(50%-5px)] sm:w-[calc(33.33%-7px)] md:w-[calc(25%-8px)] lg:w-[calc(20%-8px)] shrink-0"
            >
              <ProductCard
                title={displayName}
                colors={[legacyToColorOption({ ...p, name: displayName })]}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProductCarouselSection;
