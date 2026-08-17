import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Phase 10.5A — source-level regression guards for the SEO route contract
 * established in 10.4O/10.4P. These don't hit a server; they read the
 * route source files directly, so they run in CI with zero setup and catch
 * a future accidental second `generateMetadata()` owner or a route file
 * going missing.
 */
const ROOT = path.resolve(__dirname, "..", "..");

const SEO_ROUTES = [
  "app/page.tsx",
  "app/products/[slug]/page.tsx",
  "app/category/[slug]/page.tsx",
  "app/brand/[slug]/page.tsx",
  "app/collections/[slug]/page.tsx",
];

describe("SEO route ownership contract", () => {
  it.each(SEO_ROUTES)("%s exists", (relativePath) => {
    expect(fs.existsSync(path.join(ROOT, relativePath))).toBe(true);
  });

  it.each(SEO_ROUTES)("%s has exactly one generateMetadata() export", (relativePath) => {
    const source = fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
    const matches = source.match(/export\s+async\s+function\s+generateMetadata/g) ?? [];

    expect(matches.length).toBe(1);
  });

  it("Category/Brand/Collection routes source their seo mapping from the shared buildSeoMetadata helper", () => {
    // Guards against a future route quietly reimplementing its own
    // Metadata construction (and drifting from the shared og:type-safety
    // fix) instead of reusing lib/seo-metadata.ts.
    for (const relativePath of [
      "app/products/[slug]/page.tsx",
      "app/category/[slug]/page.tsx",
      "app/brand/[slug]/page.tsx",
      "app/collections/[slug]/page.tsx",
    ]) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
      expect(source).toContain("buildSeoMetadata");
    }
  });

  it("Category/Brand/Collection routes render at most one JSON-LD script tag", () => {
    for (const relativePath of [
      "app/category/[slug]/page.tsx",
      "app/brand/[slug]/page.tsx",
      "app/collections/[slug]/page.tsx",
    ]) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
      const matches = source.match(/type=["']application\/ld\+json["']/g) ?? [];

      expect(matches.length).toBeLessThanOrEqual(1);
    }
  });

  it("the homepage documents the NEXT_PUBLIC_SITE_URL production requirement rather than hardcoding a domain", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf-8");

    expect(source).toContain("NEXT_PUBLIC_SITE_URL");
    // Never a hardcoded production domain baked into application logic —
    // only a documented localhost fallback for local dev is allowed here.
    expect(source).not.toMatch(/marvelouslifestyle\.com/);
  });

  it(".env.example documents NEXT_PUBLIC_SITE_URL as required for production", () => {
    const source = fs.readFileSync(path.join(ROOT, ".env.example"), "utf-8");

    expect(source).toMatch(/NEXT_PUBLIC_SITE_URL/);
    expect(source.toLowerCase()).toMatch(/production/);
  });
});
