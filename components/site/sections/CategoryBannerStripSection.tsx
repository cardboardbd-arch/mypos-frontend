"use client";

import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection, SectionBannerItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function CategoryBannerStripSection({ section }: Props) {
  const items = (section.items ?? []) as SectionBannerItem[];

  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, i) => {
          const image = resolveMediaUrl(item.image);
          if (!image) return null;

          const tile = (
            <div className="group relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={item.title ?? ""}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {item.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 md:p-4">
                  <p className="text-white text-xs md:text-sm font-black uppercase tracking-wider">{item.title}</p>
                </div>
              )}
            </div>
          );

          return item.link ? (
            <Link key={i} href={item.link} className="block">
              {tile}
            </Link>
          ) : (
            <div key={i}>{tile}</div>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryBannerStripSection;
