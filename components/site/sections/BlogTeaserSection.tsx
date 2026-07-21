"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection, SectionBlogItem } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function BlogTeaserSection({ section }: Props) {
  const items = (section.items ?? []) as SectionBlogItem[];
  const heading = (section.content as { heading?: string } | undefined)?.heading ?? section.title;

  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">{heading}</h2>
        {section.view_all_link && (
          <Link
            href={section.view_all_link}
            className="text-sm font-medium text-gray-500 hover:text-black transition"
          >
            View All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((post) => {
          const cover = resolveMediaUrl(post.cover_image);
          return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={post.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <Newspaper className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="p-4">
              <p className="font-bold text-sm text-gray-900 line-clamp-2">{post.name}</p>
              {post.excerpt && (
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{post.excerpt}</p>
              )}
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}

export default BlogTeaserSection;
