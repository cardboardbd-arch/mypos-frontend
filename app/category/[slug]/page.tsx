import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategory, getProducts } from "@/lib/api";
import { toColorOption } from "@/lib/product-adapters";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { SeoBlock, WebsiteProductCard } from "@/lib/types/product";

/**
 * Phase 10.4O — the approved public URL for a category is /category/{slug},
 * matching CategoryResource.seo.canonical and generateCategorySchema()'s
 * schema.url (both already point here). Server-rendered (like
 * app/products/[slug]) rather than "use client" (like the shop/collections
 * pages) specifically so generateMetadata() can run — the whole point of
 * this route existing is to give search engines a real, crawlable page.
 */
interface CategoryDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  banner: string | null;
  product_count: number;
  schema?: Record<string, unknown> | null;
  seo: SeoBlock | null;
}

async function fetchCategory(slug: string): Promise<CategoryDetail | null> {
  try {
    const res = await getCategory(slug);
    return (res?.data as CategoryDetail) ?? null;
  } catch {
    return null;
  }
}

async function fetchCategoryProducts(slug: string): Promise<WebsiteProductCard[]> {
  try {
    const res = await getProducts({ category: slug });
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
  const category = await fetchCategory(slug);
  if (!category) return {};

  return buildSeoMetadata({
    seo: category.seo,
    fallbackTitle: category.name,
    fallbackDescription: category.description,
    fallbackImage: category.image,
  });
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    notFound();
  }

  const products = await fetchCategoryProducts(slug);
  const heroImage = category.banner || category.image;

  return (
    <>
      {category.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(category.schema) }}
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
                  <img src={heroImage} alt={category.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{category.name}</h1>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">{category.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {category.product_count} {category.product_count === 1 ? "product" : "products"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No products in this category yet.</p>
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
