"use client";

import type { RawHomepageSection, SectionTrustItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

const DEFAULT_ITEMS: SectionTrustItem[] = [
  { icon: "🏷️", title: "NO BARGAINS", subtitle: "100+ Brands fixed price" },
  { icon: "🚚", title: "FREE SHIPPING", subtitle: "On orders over ৳1500" },
  { icon: "💬", title: "CUSTOMER SERVICE", subtitle: "24/7 Dedicated support" },
  { icon: "🔒", title: "SECURED PAYMENT", subtitle: "100% Safe transactions" },
];

export function TrustBarSection({ section }: Props) {
  const config = (section.config ?? {}) as {
    items?: SectionTrustItem[];
    background_color?: string;
    text_color?: string;
  };

  const rawItems = (section.items?.length ? section.items : config.items) as SectionTrustItem[] | undefined;
  const items = rawItems && rawItems.length > 0 ? rawItems : DEFAULT_ITEMS;

  const bgColor = config.background_color || "#f8f9fa";
  const textColor = config.text_color || "#111111";

  return (
    <section className="w-full my-2">
      <div
        className="rounded-2xl border border-gray-100 p-4 md:p-6 transition shadow-xs"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200/60">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3.5 ${i > 0 ? "pt-3 md:pt-0 md:pl-6" : ""}`}
            >
              <div className="text-2xl md:text-3xl shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white/80 dark:bg-black/10 shadow-xs">
                {item.icon || "✨"}
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider leading-tight">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-[11px] md:text-xs opacity-70 mt-0.5 leading-snug truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustBarSection;
