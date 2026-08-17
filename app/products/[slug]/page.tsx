import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductDetailClient } from "@/components/site/ProductDetailClient";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { WebsiteProductDetail } from "@/lib/types/product";

/**
 * WP6 — first genuine SSR in this app (there was none before this: the
 * homepage, shop listing, and this very page were all previously
 * "use client" + useEffect-fetched, per the WP6 audit). Scoped to just
 * this page because it's the one place a concrete field-mapping
 * requirement existed (product detail SEO -> metadata). The rest of the
 * app's client-fetch rendering strategy is deliberately left as-is —
 * converting it too would be a rendering-architecture change beyond
 * "refactor the data flow for the new backend."
 *
 * Resolves by website_products.slug (WP4) — NOT products.slug. A slug
 * that only exists in the older style-level system (e.g. one reached via
 * /v1/search or /v1/collections/{slug}/products, which still return
 * products.slug) will 404 here. See the WP6 report for the full
 * cross-page-link risk this creates.
 */
async function fetchProduct(slug: string): Promise<WebsiteProductDetail | null> {
  try {
    const res = await getProduct(slug);
    return (res?.data as WebsiteProductDetail) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return {};

  return buildSeoMetadata({
    seo: product.seo,
    fallbackTitle: product.title,
    fallbackDescription: product.short_description,
    fallbackImage: product.featured_image,
    rawOgType: "product",
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Nav />
      <ProductDetailClient initialProduct={product} />
      <Footer />
    </>
  );
}
