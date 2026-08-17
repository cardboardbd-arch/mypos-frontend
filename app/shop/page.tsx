"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Search, X, ChevronDown } from "lucide-react";
import { toColorOption, legacyToColorOption, groupCardsByProduct, type GroupedProductCard } from "@/lib/product-adapters";
import type { WebsiteProductCard, LegacyProductCard, ProductDisplayMode } from "@/lib/types/product";

interface Category { id: number; name: string; slug: string; }
interface Brand { id: number; name: string; slug: string; }

function ShopContent() {
  const searchParams = useSearchParams();
  // Browsing (no search term) hits /v1/products — the new WP4 per-color
  // shape. Searching hits /v1/search, which still returns the OLDER
  // style-level ProductCardResource shape (see WP6 report) — kept in a
  // separate state so the two shapes are never accidentally mixed.
  const [browseCards, setBrowseCards] = useState<WebsiteProductCard[]>([]);
  const [searchResults, setSearchResults] = useState<LegacyProductCard[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [displayMode, setDisplayMode] = useState<ProductDisplayMode>("individual");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") ?? "");
  const [sortBy, setSortBy] = useState("newest");
  const BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${BASE}/v1/categories`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
    fetch(`${BASE}/v1/brands`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setBrands(d.data ?? []))
      .catch(() => setBrands([]));
    // WP5 — the ONLY place product_display_mode is exposed is /v1/home's
    // theme block; there's no lighter dedicated endpoint, so this fetch
    // (and its otherwise-unused homepage payload) is a known, accepted
    // overhead just to read one field. Falls back to "individual" (WP4's
    // existing behavior) on any failure, matching the backend default.
    fetch(`${BASE}/v1/home`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setDisplayMode(d?.data?.theme?.product_display_mode ?? "individual"))
      .catch(() => setDisplayMode("individual"));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const q = search.trim();
    const params = new URLSearchParams();

    let url: string;
    const searching = !!q;
    setIsSearchMode(searching);
    if (searching) {
      url = `${BASE}/v1/search?${new URLSearchParams({ q, ...(selectedCategory ? { category: selectedCategory } : {}), ...(selectedBrand ? { brand: selectedBrand } : {}) }).toString()}`;
    } else {
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedBrand) params.set("brand", selectedBrand);
      if (sortBy) params.set("sort", sortBy);
      url = `${BASE}/v1/products?${params.toString()}`;
    }

    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (searching) {
          setSearchResults((d.data?.products as LegacyProductCard[]) ?? []);
          setBrowseCards([]);
        } else {
          setBrowseCards((d.data as WebsiteProductCard[]) ?? []);
          setSearchResults([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [search, selectedCategory, selectedBrand, sortBy]);

  // Unifies both API shapes + both display modes into one render-ready
  // list. Search results never group (no color concept in that older
  // shape); browse results group by product_id only when "grouped" mode
  // is active — "individual" renders the flat WP4 listing as-is (one
  // card per published color), matching backend WP4's default exactly.
  const renderCards: GroupedProductCard[] = useMemo(() => {
    if (isSearchMode) {
      return searchResults.map((item) => ({
        productId: item.id,
        title: item.name,
        colors: [legacyToColorOption(item)],
      }));
    }
    if (displayMode === "grouped") {
      return groupCardsByProduct(browseCards);
    }
    return browseCards.map((card) => ({
      productId: card.id,
      title: card.title,
      colors: [toColorOption(card)],
    }));
  }, [isSearchMode, searchResults, browseCards, displayMode]);

  const clearFilters = () => { setSearch(""); setSelectedCategory(""); setSelectedBrand(""); setSortBy("newest"); };
  const hasFilters = search || selectedCategory || selectedBrand;

  return (
    <>
      <Nav />

      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Shop</h1>
            <p className="text-xs text-gray-400 mt-1">{loading ? "Loading…" : `${renderCards.length} products found`}</p>
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black bg-white">
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex gap-8">

            <aside className="hidden lg:block w-64 shrink-0">

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search products..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition" />
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mb-4 font-bold">
                  <X className="h-3 w-3" /> Clear All Filters
                </button>
              )}

              <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider">Categories</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="p-3 space-y-1 bg-white">
                  <button onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition font-medium
                      ${!selectedCategory ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition
                        ${selectedCategory === c.slug ? 'bg-black text-white font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider">Brands</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="p-3 space-y-1">
                  <button onClick={() => setSelectedBrand("")}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition font-medium
                      ${!selectedBrand ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                    All Brands
                  </button>
                  {brands.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBrand(b.slug)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition
                        ${selectedBrand === b.slug ? 'bg-black text-white font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
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

              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-wider">Product Type</h3>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="p-3 space-y-1 bg-white">
                  {["Simple", "Variable", "Bundle", "Digital"].map((type) => (
                    <label key={type} className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-gray-600 hover:text-black rounded-lg hover:bg-gray-50">
                      <input type="checkbox" className="accent-black" />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">

              {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategory && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {categories.find(c => c.slug === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory("")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {brands.find(b => b.slug === selectedBrand)?.name}
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
                    <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[4/5]" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm mb-4">Failed to load products.</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">Retry</button>
                </div>
              ) : renderCards.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm">No products found.</p>
                  <button onClick={clearFilters} className="mt-4 text-xs font-bold underline">Clear filters</button>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
