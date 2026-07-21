"use client";

import Link from "next/link";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function AnnouncementBarSection({ section }: Props) {
  const config = (section.config ?? {}) as {
    message?: string;
    link?: string | null;
    background_color?: string;
    text_color?: string;
    is_marquee?: boolean;
  };

  const message = config.message;
  if (!message) return null;

  const bg = config.background_color || "#111111";
  const color = config.text_color || "#ffffff";

  const content = config.is_marquee ? (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-marquee">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="mx-8 text-xs font-bold uppercase tracking-widest">
            {message}
          </span>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-center text-xs font-bold uppercase tracking-widest px-4 py-2.5">
      {message}
    </p>
  );

  const bar = (
    <div style={{ backgroundColor: bg, color }} className="w-full rounded-xl">
      {content}
    </div>
  );

  return (
    <section className="w-full">
      <style>{`
        @keyframes homepage-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee { animation: homepage-marquee 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
      `}</style>
      {config.link ? (
        <Link href={config.link} className="block hover:opacity-90 transition-opacity">
          {bar}
        </Link>
      ) : (
        bar
      )}
    </section>
  );
}

export default AnnouncementBarSection;
