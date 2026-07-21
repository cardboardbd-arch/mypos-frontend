"use client";

import Link from "next/link";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function AboutSection({ section }: Props) {
  const content = (section.content ?? {}) as {
    heading?: string;
    short_description?: string;
    image?: string | null;
    button_text?: string;
    button_url?: string;
  };

  if (!content.heading && !content.short_description) return null;

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-12 flex flex-col justify-center gap-4">
          {content.heading && (
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
              {content.heading}
            </h2>
          )}
          {content.short_description && (
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              {content.short_description}
            </p>
          )}
          {content.button_text && content.button_url && (
            <Link
              href={content.button_url}
              className="inline-block w-fit mt-2 bg-black text-white font-bold uppercase text-xs tracking-widest px-7 py-3 hover:bg-gray-800 transition-colors"
            >
              {content.button_text}
            </Link>
          )}
        </div>
        <div className="hidden md:block bg-gray-100 min-h-[220px]">
          {content.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.image} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
