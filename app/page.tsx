import type { Metadata } from "next";
import HomeClient from "@/components/site/HomeClient";

/**
 * Phase 10.4P — homepage SEO.
 *
 * The SeoSettings admin form's "Homepage SEO" fields (homepage_meta_title/
 * homepage_meta_description/homepage_og_image) are NOT exposed by any
 * public API (confirmed: grep across app/routes/resources finds them only
 * inside SeoSettings.php itself). Per this phase's hard-stop rule, those
 * specific fields are NOT consumed here, and no backend change was made to
 * expose them.
 *
 * However, /v1/home already returns its own, separate, already-public top-
 * level `seo` object (HomepageService::seo() — sourced from the
 * seo_title/seo_description/canonical_url/og_image/robots settings, or a
 * SeoMeta row on StoreSetting id=1; live-verified: GET /v1/home ->
 * data.seo = {title, description, canonical, og_image, robots}). That IS
 * an existing public API path providing real homepage SEO data, so it's
 * consumed here instead of leaving the homepage unimplemented.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Without this, Next statically prerenders "/" at build time (it has no
// [slug] segment forcing dynamic rendering the way the other four SEO
// pages get automatically) and freezes generateMetadata()'s fetch result
// into that build — admin SEO edits wouldn't show up until the next
// deploy. This restores the same per-request behavior every other SEO
// page already has; it disables caching, it doesn't add any.
export const dynamic = "force-dynamic";

interface HomeSeo {
  title: string | null;
  description: string | null;
  canonical: string | null;
  og_image: string | null;
  robots: string | null;
}

async function fetchHomeSeo(): Promise<HomeSeo | null> {
  try {
    // /v1/home's payload is the full homepage feed (sections, categories,
    // products, theme, ...) — HomeClient fetches it again client-side for
    // the page body. This second, server-side fetch of the same endpoint
    // just for the small top-level `seo` object is the same "known,
    // accepted overhead for one field" pattern already used elsewhere in
    // this codebase (app/shop/page.tsx fetches /v1/home solely to read
    // theme.product_display_mode) — there's no lighter existing endpoint
    // that returns only the seo block.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/home`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.seo as HomeSeo) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchHomeSeo();

  const title = seo?.title ?? undefined;
  const description = seo?.description ?? undefined;
  const image = seo?.og_image ?? undefined;
  // The homepage canonical is always the frontend root — not whatever
  // (possibly unset) canonical_url HomepageService returns, and never the
  // Laravel app.url domain.
  const canonical = `${SITE_URL}/`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: seo?.robots ?? undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function HomePage() {
  return <HomeClient />;
}
