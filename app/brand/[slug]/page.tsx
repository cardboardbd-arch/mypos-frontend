import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { getBrand, getProducts } from "@/lib/api";
import { toColorOption } from "@/lib/product-adapters";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { SeoBlock, WebsiteProductCard } from "@/lib/types/product";

/**
 * Phase 10.4O — the approved public URL for a brand is /brand/{slug},
 * matching BrandResource.seo.canonical and the sitemap's existing pattern.
 * Server-rendered like app/category/[slug] and app/products/[slug] so
 * generateMetadata() can run.
 */
interface BrandDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  logo: string | null;
  banner: string | null;
  cover_image: string | null;
  og_image: string | null;
  product_count: number;
  schema?: Record<string, unknown> | null;
  seo: SeoBlock | null;
}

async function fetchBrand(slug: string): Promise<BrandDetail | null> {
  try {
    const res = await getBrand(slug);
    return (res?.data as BrandDetail) ?? null;
  } catch {
    return null;
  }
}

async function fetchBrandProducts(slug: string): Promise<WebsiteProductCard[]> {
  try {
    const res = await getProducts({ brand: slug });
    return (res?.data as WebsiteProductCard[]) ?? [];
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
  const brand = await fetchBrand(slug);
  if (!brand) return {};

  return buildSeoMetadata({
    seo: brand.seo,
    fallbackTitle: brand.name,
    fallbackDescription: brand.short_description ?? brand.description,
    fallbackImage: brand.og_image ?? brand.logo,
  });
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await fetchBrand(slug);

  if (!brand) {
    notFound();
  }

  const products = await fetchBrandProducts(slug);
  const heroImage = brand.banner || brand.cover_image || brand.logo;

  return (
    <>
      {brand.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brand.schema) }}
        />
      )}
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {heroImage && (
                <div className="w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt={brand.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{brand.name}</h1>
                {(brand.short_description || brand.description) && (
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">
                    {brand.short_description || brand.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {brand.product_count} {brand.product_count === 1 ? "product" : "products"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No products from this brand yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
              {products.map((p) => (
                <ProductCard key={p.id} title={p.title} colors={[toColorOption(p)]} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
