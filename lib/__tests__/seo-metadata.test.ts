import { describe, expect, it } from "vitest";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { SeoBlock } from "@/lib/types/product";

/**
 * Phase 10.5A — regression coverage for buildSeoMetadata(), the shared
 * mapping used by Product/Category/Brand/Collection generateMetadata().
 * Homepage (app/page.tsx) builds its own Metadata object inline instead of
 * through this helper (it consumes a differently-shaped `seo` object — see
 * that file's own docblock) and is intentionally NOT covered here to avoid
 * refactoring working code just to make it unit-testable.
 */
const populatedSeo: SeoBlock = {
  meta_title: "Custom Title",
  meta_description: "Custom description",
  meta_keywords: "a,b,c",
  canonical: "https://www.marvelouslifestyle.com/products/example",
  og_image: "https://api.marvelouslifestyle.com/storage/example.jpg",
  robots: "index,follow",
};

describe("buildSeoMetadata", () => {
  it("uses the API seo block when populated", () => {
    const meta = buildSeoMetadata({
      seo: populatedSeo,
      fallbackTitle: "Fallback Title",
      fallbackDescription: "Fallback description",
      fallbackImage: "https://api.marvelouslifestyle.com/storage/fallback.jpg",
    });

    expect(meta.title).toBe("Custom Title");
    expect(meta.description).toBe("Custom description");
    expect(meta.alternates).toEqual({ canonical: populatedSeo.canonical });
    expect(meta.robots).toBe("index,follow");
    expect(meta.openGraph?.url).toBe(populatedSeo.canonical);
    expect(meta.openGraph?.images).toEqual([{ url: populatedSeo.og_image }]);
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Custom Title",
      description: "Custom description",
    });
  });

  it("falls back to the entity's own title/description/image when seo is null", () => {
    const meta = buildSeoMetadata({
      seo: null,
      fallbackTitle: "Product Title",
      fallbackDescription: "Product short description",
      fallbackImage: "https://api.marvelouslifestyle.com/storage/product.jpg",
    });

    expect(meta.title).toBe("Product Title");
    expect(meta.description).toBe("Product short description");
    // No canonical was ever supplied by the API and none is fabricated here.
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph?.images).toEqual([
      { url: "https://api.marvelouslifestyle.com/storage/product.jpg" },
    ]);
  });

  it("does not fabricate a fallback description or image when neither exists", () => {
    const meta = buildSeoMetadata({
      seo: null,
      fallbackTitle: "Bare Title",
    });

    expect(meta.title).toBe("Bare Title");
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("treats an empty-string API description as a real value, not a fallback trigger", () => {
    const meta = buildSeoMetadata({
      seo: { ...populatedSeo, meta_description: "" },
      fallbackTitle: "Fallback Title",
      fallbackDescription: "Should not be used",
    });

    expect(meta.description).toBe("");
  });

  it("routes a non-standard og:type through `other` instead of the structured openGraph.type field", () => {
    // Regression guard for the Phase 10.4P bug: Next's openGraph.type is a
    // strict literal union that throws at render time (dropping ALL page
    // metadata) for an unrecognized value like "product". See
    // lib/seo-metadata.ts's own docblock for the live-verified failure.
    const meta = buildSeoMetadata({
      seo: populatedSeo,
      fallbackTitle: "Product Title",
      rawOgType: "product",
    });

    expect(meta.openGraph).not.toHaveProperty("type");
    expect(meta.other).toEqual({ "og:type": "product" });
  });

  it("omits `other` entirely (no empty og:type tag) when rawOgType is not supplied", () => {
    const meta = buildSeoMetadata({
      seo: populatedSeo,
      fallbackTitle: "Category Title",
    });

    expect(meta.other).toBeUndefined();
  });

  it("produces exactly one value per metadata field — no structural duplication possible", () => {
    const meta = buildSeoMetadata({
      seo: populatedSeo,
      fallbackTitle: "Title",
      rawOgType: "product",
    });

    // A single Metadata object can only ever have one `title`, one
    // `alternates.canonical`, one `robots` — this assertion exists mainly
    // to document that metadata-duplication regressions for these routes
    // can only come from Next.js rendering >1 generateMetadata() owner for
    // the same route (a build/route-file concern), not from this function.
    expect(typeof meta.title).toBe("string");
    expect(Object.keys(meta.alternates ?? {})).toEqual(["canonical"]);
  });
});
