"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  toColorOption,
  groupCardsByProduct,
  type GroupedProductCard,
} from "@/lib/product-adapters";
import type { WebsiteProductCard, ProductDisplayMode } from "@/lib/types/product";

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
}

interface CategoryDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  banner: string | null;
  product_count: number;
  children?: SubCategory[];
}

/** Sidebar / filter panel — shared by desktop & mobile drawer */
function FilterPanel({
  search, setSearch,
  selectedSub, setSelectedSub,
  selectedBrand, setSelectedBrand,
  subCategories, brands,
  hasFilters, clearFilters,
  onClose,
}: {
  search: string; setSearch: (v: string) => void;
  selectedSub: string; setSelectedSub: (v: string) => void;
  selectedBrand: string; setSelectedBrand: (v: string) => void;
  subCategories: SubCategory[]; brands: Brand[];
  hasFilters: boolean; clearFilters: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition"
        />
      </div>

      {hasFilters && (
        <button
          onClick={() => { clearFilters(); onClose?.(); }}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold"
        >
          <X className="h-3 w-3" /> Clear All Filters
        </button>
      )}

      {/* Sub-categories */}
      {subCategories.length > 0 && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider">Categories</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="p-3 space-y-1 bg-white max-h-56 overflow-y-auto">
            <button
              onClick={() => { setSelectedSub(""); onClose?.(); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition font-medium
                ${!selectedSub ? "bg-black text-white" : "hover:bg-gray-50 text-gray-700"}`}
            >
              All
            </button>
            {subCategories.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSub(s.slug); onClose?.(); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition
                  ${selectedSub === s.slug ? "bg-black text-white font-medium" : "hover:bg-gray-50 text-gray-600"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wider">Brands</h3>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="p-3 space-y-1 bg-white max-h-56 overflow-y-auto">
            <button
              onClick={() => { setSelectedBrand(""); onClose?.(); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition font-medium
                ${!selectedBrand ? "bg-black text-white" : "hover:bg-gray-50 text-gray-700"}`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectedBrand(b.slug); onClose?.(); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition
                  ${selectedBrand === b.slug ? "bg-black text-white font-medium" : "hover:bg-gray-50 text-gray-600"}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-wider">Price Range</h3>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        <div className="p-4 space-y-2 bg-white">
          {[
            { label: "Under Tk 500", value: "0-500" },
            { label: "Tk 500 - 1,000", value: "500-1000" },
            { label: "Tk 1,000 - 2,000", value: "1000-2000" },
            { label: "Tk 2,000 - 5,000", value: "2000-5000" },
            { label: "Above Tk 5,000", value: "5000-99999" },
          ].map((p) => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-black">
              <input type="radio" name="price" value={p.value} className="accent-black" />
              {p.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [products, setProducts] = useState<WebsiteProductCard[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [displayMode, setDisplayMode] = useState<ProductDisplayMode>("individual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_API_URL;

  // Fetch category info + brands + display mode
  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/v1/categories/${slug}`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setCategory(d.data ?? null))
      .catch(() => setCategory(null));

    fetch(`${BASE}/v1/brands`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setBrands(d.data ?? []))
      .catch(() => setBrands([]));

    fetch(`${BASE}/v1/home`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setDisplayMode(d?.data?.theme?.product_display_mode ?? "individual"))
      .catch(() => setDisplayMode("individual"));
  }, [slug]);

  // Fetch products with filters
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);

    const categorySlug = selectedSub || slug;
    const urlParams = new URLSearchParams({ category: categorySlug });
    if (selectedBrand) urlParams.set("brand", selectedBrand);
    if (search.trim()) urlParams.set("q", search.trim());
    if (sortBy) urlParams.set("sort", sortBy);

    fetch(`${BASE}/v1/products?${urlParams.toString()}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setProducts((d.data as WebsiteProductCard[]) ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug, selectedSub, selectedBrand, search, sortBy]);

  const renderCards: GroupedProductCard[] = useMemo(() => {
    if (displayMode === "grouped") return groupCardsByProduct(products);
    return products.map((card) => ({ productId: card.id, title: card.title, colors: [toColorOption(card)] }));
  }, [products, displayMode]);

  const clearFilters = () => { setSearch(""); setSelectedSub(""); setSelectedBrand(""); setSortBy("newest"); };
  const hasFilters = !!(search || selectedSub || selectedBrand);
  const subCategories: SubCategory[] = category?.children ?? [];
  const heroImage = category?.banner || category?.image;

  const filterProps = { search, setSearch, selectedSub, setSelectedSub, selectedBrand, setSelectedBrand, subCategories, brands, hasFilters, clearFilters };

  return (
    <>
      <Nav />

      {/* ── Category Header ──────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {heroImage && (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 hidden sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt={category?.name ?? ""} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {category?.name ?? "Loading..."}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {loading ? "Loading…" : `(${renderCards.length} products found)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium bg-white hover:border-black transition"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="ml-1 bg-black text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {[selectedSub, selectedBrand, search].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-wider">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-gray-500 hover:text-black transition" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel {...filterProps} onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex gap-8">

            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterPanel {...filterProps} />
            </aside>

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSub && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {subCategories.find((s) => s.slug === selectedSub)?.name ?? selectedSub}
                      <button onClick={() => setSelectedSub("")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {brands.find((b) => b.slug === selectedBrand)?.name ?? selectedBrand}
                      <button onClick={() => setSelectedBrand("")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {search && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      &quot;{search}&quot;
                      <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton rounded-2xl aspect-[4/5]" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm mb-4">Failed to load products.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-black text-white text-sm font-bold rounded"
                  >
                    Retry
                  </button>
                </div>
              ) : renderCards.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm">No products found in this category.</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-4 text-xs font-bold underline">
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
                  {renderCards.map((g) => (
                    <ProductCard key={g.productId} title={g.title} colors={g.colors} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
