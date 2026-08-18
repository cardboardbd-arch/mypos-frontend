"use client";

import Link from "next/link";
import type { RawHomepageSection, SectionOutletItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function FindUsSection({ section }: Props) {
  const outlets = (section.items ?? []) as SectionOutletItem[];
  const viewAllLink = section.view_all_link || "/stores";

  if (!outlets || outlets.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
            {section.title || "Find Us"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {outlets.map((outlet, i) => (
          <div
            key={outlet.id ?? i}
            className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition bg-white"
          >
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3 text-lg">
              📍
            </div>
            <p className="font-black text-sm text-gray-900">{outlet.name}</p>
            {outlet.area && (
              <p className="text-xs text-gray-400 mt-1 font-medium">{outlet.area}</p>
            )}
            {outlet.address && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{outlet.address}</p>
            )}
            {outlet.shopping_hours && (
              <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                <span>🕒</span> {outlet.shopping_hours}
              </p>
            )}
            {outlet.phone && (
              <p className="text-xs font-bold text-black mt-2.5">📞 {outlet.phone}</p>
            )}
            {outlet.map_link && (
              <a
                href={outlet.map_link}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-[11px] font-bold text-blue-600 hover:underline"
              >
                View on Map ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default FindUsSection;
