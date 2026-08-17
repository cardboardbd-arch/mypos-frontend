import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { getCollection, getCollectionProducts } from "@/lib/api";
import { legacyToColorOption } from "@/lib/product-adapters";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { LegacyProductCard, SeoBlock } from "@/lib/types/product";
import { ChevronRight } from "lucide-react";

/**
 * Phase 10.4P — converted from "use client" + useEffect to a server
 * component (matching app/products/[slug], app/category/[slug],
 * app/brand/[slug]) so generateMetadata() can run and SEO metadata is
 * present in the initial HTML rather than only after hydration.
 * fetchCollection() is shared between generateMetadata() and the page body
 * (Next's fetch() request memoization dedupes the two calls into one
 * network request, same as the other three detail pages) — no new/second
 * request is introduced.
 */
interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  banner?: string | null;
  cover_image?: string | null;
  featured_image?: string | null;
  og_image?: string | null;
  product_count: number;
  schema?: Record<string, unknown> | null;
  seo: SeoBlock | null;
}

async function fetchCollection(slug: string): Promise<Collection | null> {
  try {
    const res = await getCollection(slug);
    return (res?.data as Collection) ?? null;
  } catch {
    return null;
  }
}

async function fetchCollectionProducts(slug: string): Promise<LegacyProductCard[]> {
  try {
    // /v1/collections/{slug}/products still returns the OLDER
    // ProductCardResource shape (backend WP4/WP5 didn't touch this
    // endpoint — see WP6 report) — no `color` field, `name` not `title`.
    const res = await getCollectionProducts(slug);
    return (res?.data as LegacyProductCard[]) ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollection(slug);
  if (!collection) return {};

  return buildSeoMetadata({
    seo: collection.seo,
    fallbackTitle: collection.name,
    fallbackDescription: collection.short_description ?? collection.description,
    fallbackImage: collection.og_image ?? collection.featured_image ?? collection.banner,
  });
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await fetchCollection(slug);

  // Preserving the existing behavior (a friendly in-page message, not a
  // hard notFound()/404) rather than changing this route's error handling
  // as part of an SEO-metadata phase.
  if (!collection) {
    return (
      <>
        <Nav />
        <div className="bg-[#e8e8e8] min-h-screen">
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm mb-4">This collection doesn&apos;t exist or is no longer available.</p>
            <Link href="/collections" className="px-4 py-2 bg-black text-white text-sm font-bold rounded inline-block">Back to Collections</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const products = await fetchCollectionProducts(slug);
  const heroImage = collection.banner || collection.cover_image || collection.featured_image;

  return (
    <>
      {collection.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collection.schema) }}
        />
      )}
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              <Link href="/collections" className="hover:text-black">Collections</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-black font-medium">{collection.name}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {heroImage && (
                <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt={collection.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{collection.name}</h1>
                {(collection.short_description || collection.description) && (
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">{collection.short_description || collection.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{collection.product_count} {collection.product_count === 1 ? "product" : "products"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No products in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
              {products.map((p) => (
                <ProductCard key={p.id} title={p.name} colors={[legacyToColorOption(p)]} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
