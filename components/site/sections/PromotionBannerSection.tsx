"use client";

import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function PromotionBannerSection({ section }: Props) {
  const config = (section.config ?? {}) as {
    heading?: string;
    subheading?: string;
    button_text?: string;
    button_link?: string;
    background_color?: string;
    image?: string | null;
  };

  if (!config.heading && !section.image) return null;

  const image = section.image ?? resolveMediaUrl(config.image);
  const bg = config.background_color || "#111111";

  const inner = (
    <div
      className="relative w-full rounded-2xl overflow-hidden flex items-center min-h-[220px] md:min-h-[280px] px-8 md:px-14"
      style={{ backgroundColor: bg }}
    >
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/30" />
        </>
      )}
      <div className="relative z-10 max-w-md">
        {config.heading && (
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white text-balance">
            {config.heading}
          </h2>
        )}
        {config.subheading && (
          <p className="text-sm md:text-base text-white/80 mt-3">{config.subheading}</p>
        )}
        {config.button_text && config.button_link && (
          <Link
            href={config.button_link}
            className="inline-block mt-6 bg-white text-black font-bold uppercase text-xs tracking-widest px-7 py-3 hover:bg-gray-100 transition-colors"
          >
            {config.button_text}
          </Link>
        )}
      </div>
    </div>
  );

  return <section className="w-full">{inner}</section>;
}

export default PromotionBannerSection;
