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

  const image = resolveMediaUrl(section.image) ?? resolveMediaUrl(config.image);
  const bg = config.background_color || "#111111";
  const hasTextContent = Boolean(config.heading || config.subheading || (config.button_text && config.button_link));

  const content = (
    <div
      className="relative w-full rounded-2xl overflow-hidden flex items-center min-h-[140px] md:min-h-[220px]"
      style={{ backgroundColor: bg }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={config.heading ?? "Promotion Banner"}
          className="w-full h-full object-cover rounded-2xl"
        />
      )}

      {hasTextContent && (
        <div className="absolute inset-0 z-10 flex items-center px-8 md:px-14">
          <div className="max-w-md">
            {config.heading && (
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white text-balance drop-shadow-md">
                {config.heading}
              </h2>
            )}
            {config.subheading && (
              <p className="text-sm md:text-base text-white/90 mt-3 drop-shadow">
                {config.subheading}
              </p>
            )}
            {config.button_text && config.button_link && (
              <Link
                href={config.button_link}
                className="inline-block mt-6 bg-white text-black font-bold uppercase text-xs tracking-widest px-7 py-3 hover:bg-gray-100 transition-colors shadow"
              >
                {config.button_text}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="w-full">
      {config.button_link && !hasTextContent ? (
        <Link href={config.button_link} className="block w-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </section>
  );
}

export default PromotionBannerSection;
