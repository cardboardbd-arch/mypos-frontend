"use client";

import { useState } from "react";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function SeoContentSection({ section }: Props) {
  const content = (section.content ?? {}) as {
    heading?: string;
    rich_text_content?: string;
    read_more_toggle?: boolean;
    collapsed_height?: number;
  };

  const [expanded, setExpanded] = useState(false);
  const canCollapse = Boolean(content.read_more_toggle && content.collapsed_height);

  if (!content.heading && !content.rich_text_content) return null;

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-gray-100 p-6 md:p-8">
        {content.heading && (
          <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900 mb-3">
            {content.heading}
          </h2>
        )}

        <div className="relative">
          <div
            className="prose prose-sm max-w-none text-gray-500 overflow-hidden transition-[max-height] duration-300"
            style={
              canCollapse && !expanded
                ? { maxHeight: content.collapsed_height }
                : { maxHeight: "none" }
            }
            dangerouslySetInnerHTML={{ __html: content.rich_text_content ?? "" }}
          />
          {canCollapse && !expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {canCollapse && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-900 hover:underline"
          >
            {expanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
    </section>
  );
}

export default SeoContentSection;
