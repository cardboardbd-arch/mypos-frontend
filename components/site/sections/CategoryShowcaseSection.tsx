"use client";

import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection, SectionShowcaseItem } from "./types";

// Distinct from CategoryGridSection ("categories"/"featured_categories"):
// a single 4-up row of tall/portrait fashion-photography cards with the
// label centered at the bottom in a dark pill, vs. CategoryGridSection's
// square tiles with a bottom-left label. Reference: Faisal's design.
interface Props {
  section: RawHomepageSection;
}

export function CategoryShowcaseSection({ section }: Props) {
  const items = (section.items ?? []) as SectionShowcaseItem[];
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {items.map((item, i) => {
          const image = resolveMediaUrl(item.image);
          const href = (item as any).href || (item.slug ? `/categories/${item.slug}` : undefined);
          const label = item.label ?? "";

          const card = (
            <div className="group relative aspect-[2/3] overflow-hidden bg-gray-100">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-300">
                  {label.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {label && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <span className="block bg-black/60 text-white text-xs font-bold uppercase tracking-wider text-center px-4 py-2 rounded-full whitespace-nowrap">
                    {label}
                  </span>
                </div>
              )}
            </div>
          );

          return href ? (
            <Link key={i} href={href}>
              {card}
            </Link>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryShowcaseSection;
