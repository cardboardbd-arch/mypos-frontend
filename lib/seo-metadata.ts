import type { Metadata } from "next";
import type { SeoBlock } from "./types/product";

/**
 * Phase 10.4P — the seo.* -> Next.js Metadata mapping (title, description,
 * canonical, robots, Open Graph, Twitter) is identical across
 * Product/Category/Brand/Collection; each page just supplies its own
 * fallback title/description/image (used only when the API's `seo` block
 * is null or a given field is null). Consuming the API's `seo.canonical`/
 * `seo.robots` directly rather than reconstructing them — those are
 * already correct per Phase 10.4N/10.4O.
 */
export function buildSeoMetadata({
  seo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  rawOgType,
}: {
  seo: SeoBlock | null | undefined;
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackImage?: string | null;
  /**
   * A non-standard og:type (e.g. "product" — the real Open Graph
   * e-commerce spec supports it, but Next's own openGraph.type is a
   * strict literal union that does NOT include it; passing an
   * unrecognized value there throws at render time and silently kills
   * ALL metadata output for the page, verified live). Rendered instead
   * via the `other` raw-meta-tag escape hatch, so Next's structured
   * openGraph object never gets a `type` field at all here — no
   * duplicate/conflicting og:type tag.
   */
  rawOgType?: string;
}): Metadata {
  const title = seo?.meta_title ?? fallbackTitle;
  // Empty string is a real (if unhelpful) API value, not "missing" — only
  // null/undefined fall back. Next.js already omits the corresponding meta
  // tag for an empty description rather than rendering content="".
  const description = seo?.meta_description ?? fallbackDescription ?? undefined;
  const image = seo?.og_image ?? fallbackImage ?? undefined;
  const canonical = seo?.canonical;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: seo?.robots ?? undefined,
    openGraph: {
      title: title ?? undefined,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    ...(rawOgType ? { other: { "og:type": rawOgType } } : {}),
    twitter: {
      card: "summary_large_image",
      title: title ?? undefined,
      description,
      images: image ? [image] : undefined,
    },
  };
}
