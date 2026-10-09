"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { toColorOption, legacyToColorOption, groupCardsByProduct, type GroupedProductCard } from "@/lib/product-adapters";
import type { WebsiteProductCard, LegacyProductCard, ProductDisplayMode } from "@/lib/types/product";

interface Category { id: number; name: string; slug: string; }
interface Brand { id: number; name: string; slug: string; }

/** Sidebar / filter panel content — shared by desktop sidebar and mobile drawer */
function FilterPanel({
  search, setSearch,
  selectedCategory, setSelectedCategory,
  selectedBrand, setSelectedBrand,
  categories, brands,
  hasFilters, clearFilters,
  onClose,
}: {
  search: string; setSearch: (v: string) => void;
  selectedCategory: string; setSelectedCategory: (v: string) => void;
  selectedBrand: string; setSelectedBrand: (v: string) => void;
  categories: Category[]; brands: Brand[];
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

      {/* Categories */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-wider">Categories</h3>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        <div className="p-3 space-y-1 bg-white max-h-56 overflow-y-auto">
          <Link
            href="/shop"
            onClick={() => { setSelectedCategory(""); onClose?.(); }}
            className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition font-medium
              ${!selectedCategory ? "bg-black text-white" : "hover:bg-gray-50 text-gray-700"}`}
          >
            All Categories
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              onClick={onClose}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition
                ${selectedCategory === c.slug ? "bg-black text-white font-medium" : "hover:bg-gray-50 text-gray-600"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Brands */}
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

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  /** Mobile filter drawer open/closed */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") ?? "");
    setSelectedBrand(searchParams.get("brand") ?? "");
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    fetch(`${BASE}/v1/categories`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
    fetch(`${BASE}/v1/brands`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setBrands(d.data ?? []))
      .catch(() => setBrands([]));
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
    const searching = !!q;
    setIsSearchMode(searching);

    let url: string;
    if (searching) {
      url = `${BASE}/v1/search?${new URLSearchParams({ q, ...(selectedCategory ? { category: selectedCategory } : {}), ...(selectedBrand ? { brand: selectedBrand } : {}) }).toString()}`;
    } else {
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedBrand) params.set("brand", selectedBrand);
      if (sortBy) params.set("sort", sortBy);
      url = `${BASE}/v1/products?${params.toString()}`;
    }

    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
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
      .catch(() => { setError(true); setLoading(false); });
  }, [search, selectedCategory, selectedBrand, sortBy]);

  const renderCards: GroupedProductCard[] = useMemo(() => {
    if (isSearchMode) {
      return searchResults.map((item) => ({ productId: item.id, title: item.name, colors: [legacyToColorOption(item)] }));
    }
    if (displayMode === "grouped") return groupCardsByProduct(browseCards);
    return browseCards.map((card) => ({ productId: card.id, title: card.title, colors: [toColorOption(card)] }));
  }, [isSearchMode, searchResults, browseCards, displayMode]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSortBy("newest");
    router.replace("/shop", { scroll: false });
  };
  const hasFilters = !!(search || selectedCategory || selectedBrand);

  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const activeBrand = brands.find((b) => b.slug === selectedBrand);

  const pageTitle = activeCategory
    ? activeCategory.name
    : activeBrand
    ? activeBrand.name
    : search
    ? `Search: "${search}"`
    : "Shop";

  const filterProps = { search, setSearch, selectedCategory, setSelectedCategory, selectedBrand, setSelectedBrand, categories, brands, hasFilters, clearFilters };

  return (
    <>
      <Nav />

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black uppercase tracking-tight">{pageTitle}</h1>
              {activeCategory && (
                <Link
                  href={`/category/${activeCategory.slug}`}
                  className="hidden sm:inline-flex items-center text-xs font-bold text-gray-500 hover:text-black underline transition"
                >
                  View Category Page &rarr;
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
              <Link href="/" className="hover:text-black">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-black">Shop</Link>
              {activeCategory && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">{activeCategory.name}</span>
                </>
              )}
              {activeBrand && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">{activeBrand.name}</span>
                </>
              )}
              <span className="ml-2 text-gray-400">
                ({loading ? "Loading…" : `${renderCards.length} products found`})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filter button — only visible below lg */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium bg-white hover:border-black transition"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="ml-1 bg-black text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {[selectedCategory, selectedBrand, search].filter(Boolean).length}
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

      {/* ── Mobile filter drawer ─────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
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

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex gap-8">

            {/* Desktop sidebar — hidden below lg */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterPanel {...filterProps} />
            </aside>

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategory && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {activeCategory?.name ?? selectedCategory}
                      <button
                        onClick={() => {
                          setSelectedCategory("");
                          const p = new URLSearchParams(window.location.search);
                          p.delete("category");
                          const qs = p.toString();
                          router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
                        }}
                        aria-label="Remove category filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      {activeBrand?.name ?? selectedBrand}
                      <button
                        onClick={() => {
                          setSelectedBrand("");
                          const p = new URLSearchParams(window.location.search);
                          p.delete("brand");
                          const qs = p.toString();
                          router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
                        }}
                        aria-label="Remove brand filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {search && (
                    <span className="flex items-center gap-1 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      &quot;{search}&quot;
                      <button
                        onClick={() => {
                          setSearch("");
                          const p = new URLSearchParams(window.location.search);
                          p.delete("q");
                          const qs = p.toString();
                          router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
                        }}
                        aria-label="Remove search query"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
