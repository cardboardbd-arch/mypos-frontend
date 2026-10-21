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

// Incremental Static Regeneration: revalidates every 60 seconds.
// Eliminates the 3-second TTFB latency and serves cached HTML instantly.
export const revalidate = 60;

interface HomeSeo {
  title: string | null;
  description: string | null;
  canonical: string | null;
  og_image: string | null;
  robots: string | null;
}

async function fetchHomeData(): Promise<any | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/home`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const homeData = await fetchHomeData();
  const seo = homeData?.seo as HomeSeo | undefined;

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

export default async function HomePage() {
  const homeData = await fetchHomeData();
  return <HomeClient initialData={homeData} />;
}
