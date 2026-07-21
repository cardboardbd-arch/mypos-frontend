"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { ChevronRight } from "lucide-react";

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  banner?: string | null;
  cover_image?: string | null;
  featured_image?: string | null;
  product_count: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  thumbnail?: string;
  product_type: string;
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  variants?: { id: number; sku: string; price: number; compare_price?: number }[];
}

export default function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setNotFound(false);
    const BASE = process.env.NEXT_PUBLIC_API_URL;

    Promise.all([
      fetch(`${BASE}/v1/collections/${slug}`, { headers: { Accept: "application/json" } }),
      fetch(`${BASE}/v1/collections/${slug}/products`, { headers: { Accept: "application/json" } }),
    ])
      .then(async ([collectionRes, productsRes]) => {
        if (collectionRes.status === 404) {
          setNotFound(true);
          return;
        }
        if (!collectionRes.ok || !productsRes.ok) throw new Error("Request failed");

        const collectionData = await collectionRes.json();
        const productsData = await productsRes.json();
        setCollection(collectionData.data ?? null);
        setProducts(productsData.data ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const heroImage = collection?.banner || collection?.cover_image || collection?.featured_image;

  return (
    <>
      <Nav />
      <div className="bg-[#e8e8e8] min-h-screen">
        {loading ? (
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <div className="animate-pulse bg-gray-200 rounded-2xl h-40 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[4/5]" />
              ))}
            </div>
          </div>
        ) : notFound ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm mb-4">This collection doesn&apos;t exist or is no longer available.</p>
            <Link href="/collections" className="px-4 py-2 bg-black text-white text-sm font-bold rounded inline-block">Back to Collections</Link>
          </div>
        ) : error || !collection ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm mb-4">Failed to load this collection.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
          </div>
        ) : (
          <>
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
                    <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug}
                      thumbnail={p.thumbnail}
                      price={p.variants?.[0]?.price ?? 0}
                      compare_price={p.variants?.[0]?.compare_price}
                      variantId={p.variants?.[0]?.id}
                      sku={p.variants?.[0]?.sku}
                      product_type={p.product_type} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
