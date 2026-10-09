"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, User, Menu, X, Package, LogOut, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getToken, logoutCustomer, removeToken } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/resolveMediaUrl";

export interface SubSubCategoryItem {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
}

export interface SubCategoryItem {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  product_count?: number;
  children?: SubSubCategoryItem[];
}

export interface NavLink {
  label: string;
  href: string;
  type?: string;
  category_id?: number;
  collection_id?: number;
  is_mega_menu?: boolean;
  has_dropdown?: boolean;
  featured_image?: string | null;
  badge?: string | null;
  target?: string;
  subcategories?: SubCategoryItem[];
}

interface Props {
  /** From /v1/home's `navigation.links` — omit to have Nav self-fetch it. */
  navLinks?: NavLink[];
  /** From /v1/home's `site.logo` — omit to have Nav self-fetch it. */
  logoUrl?: string | null;
  /** From /v1/home's `site.name` — omit to have Nav self-fetch it. */
  siteName?: string | null;
}

const FALLBACK_NAV: NavLink[] = [
  { label: "Home",        href: "/" },
  { label: "Shop",        href: "/shop" },
  { label: "Categories",  href: "/categories" },
  { label: "Brands",      href: "/brands" },
  { label: "Collections", href: "/collections" },
  { label: "Blog",        href: "/blog" },
  { label: "Contact",     href: "/contact" },
];

const NAV_CACHE_KEY = "pos_site_nav_links";
const LOGO_CACHE_KEY = "pos_site_logo_url";
const NAME_CACHE_KEY = "pos_site_name";

export function deduplicateNavLinks(links: NavLink[]): NavLink[] {
  if (!Array.isArray(links)) return [];
  const seen = new Set<string>();
  return links.filter((link) => {
    if (!link || !link.label) return false;
    const catId = link.category_id;
    const colId = link.collection_id;
    const key = catId
      ? `cat_${catId}`
      : colId
      ? `col_${colId}`
      : `custom_${link.label.trim().toLowerCase()}_${(link.href || "").trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeNavHref(link: NavLink): string {
  let href = (link.href || "").trim();
  href = href.replace(/^https?:\/\/[^\/]+/, "");
  href = href.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/");

  if (link.type === "category" || link.category_id) {
    if (!href.startsWith("/category/") && !href.startsWith("http")) {
      const slug = (link.label || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `/category/${slug || "all"}`;
    }
  }

  if (link.type === "collection" || link.collection_id) {
    if (!href.startsWith("/collections/") && !href.startsWith("http")) {
      const slug = (link.label || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `/collections/${slug || "all"}`;
    }
  }

  return href || "/shop";
}

function getStoredNav(): NavLink[] {
  if (typeof window === "undefined") return FALLBACK_NAV;
  try {
    const raw = localStorage.getItem(NAV_CACHE_KEY);
    return raw ? deduplicateNavLinks(JSON.parse(raw)) : FALLBACK_NAV;
  } catch {
    return FALLBACK_NAV;
  }
}

function getStoredLogo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LOGO_CACHE_KEY) || null;
  } catch {
    return null;
  }
}

function getStoredSiteName(): string {
  if (typeof window === "undefined") return "Marvelous Lifestyle";
  try {
    return localStorage.getItem(NAME_CACHE_KEY) || "Marvelous Lifestyle";
  } catch {
    return "Marvelous Lifestyle";
  }
}

export function Nav({ navLinks: navLinksProp, logoUrl: logoUrlProp, siteName: siteNameProp }: Props = {}) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(() =>
    navLinksProp?.length ? deduplicateNavLinks(navLinksProp) : getStoredNav()
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(() =>
    logoUrlProp ? resolveMediaUrl(logoUrlProp) : getStoredLogo()
  );
  const [siteName, setSiteName] = useState<string>(() =>
    siteNameProp || getStoredSiteName()
  );
  const [logoError, setLogoError] = useState(false);

  const [expandedMobileMenu, setExpandedMobileMenu] = useState<Record<string, boolean>>({});
  const [expandedMobileSubMenu, setExpandedMobileSubMenu] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    // If props are passed, use and cache them immediately
    if (navLinksProp && navLinksProp.length > 0) {
      setNavLinks(navLinksProp);
      try { localStorage.setItem(NAV_CACHE_KEY, JSON.stringify(navLinksProp)); } catch {}
    }
    if (logoUrlProp !== undefined) {
      const resolved = resolveMediaUrl(logoUrlProp);
      setLogoUrl(resolved);
      setLogoError(false);
      try {
        if (resolved) localStorage.setItem(LOGO_CACHE_KEY, resolved);
        else localStorage.removeItem(LOGO_CACHE_KEY);
      } catch {}
    }
    if (siteNameProp !== undefined && siteNameProp) {
      setSiteName(siteNameProp);
      try { localStorage.setItem(NAME_CACHE_KEY, siteNameProp); } catch {}
    }

    // Always keep navigation, logo, and site name fresh from API so backend changes reflect dynamically
    const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
    const apiBase = rawBase.replace(/\/+$/, "");
    if (!apiBase) return;

    const t = Date.now();
    const tryFetch = (url: string) =>
      fetch(`${url}?t=${t}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });

    // Try dedicated navigation endpoints first, fallback to v1/home
    tryFetch(`${apiBase}/v1/navigation/header`)
      .catch(() => tryFetch(`${apiBase}/navigation/header`))
      .catch(() => tryFetch(`${apiBase}/v1/home`))
      .then((res) => {
        const items = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.links)
          ? res.data.links
          : Array.isArray(res?.links)
          ? res.links
          : Array.isArray(res?.data?.navigation?.links)
          ? res.data.navigation.links
          : [];
        if (items.length > 0) {
          const deduped = deduplicateNavLinks(items);
          setNavLinks(deduped);
          try { localStorage.setItem(NAV_CACHE_KEY, JSON.stringify(deduped)); } catch {}
        }
      })
      .catch(() => {});
  }, [navLinksProp, logoUrlProp, siteNameProp]);

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  async function handleLogout() {
    const token = getToken();
    if (token) await logoutCustomer(token).catch(() => {});
    removeToken();
    setIsLoggedIn(false);
    setAccountMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="h-20 flex items-center justify-between max-w-[1440px] mx-auto px-4">

        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center group">
          {logoUrl && !logoError ? (
            <Image
              src={logoUrl}
              alt={siteName || "Marvelous Lifestyle"}
              width={180}
              height={48}
              loading="eager"
              fetchPriority="high"
              unoptimized
              className="h-10 md:h-12 w-auto object-contain py-1 group-hover:opacity-90 transition"
              style={{ width: "auto" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex flex-col py-1">
              <span className="font-black text-xl md:text-2xl tracking-tight uppercase text-black leading-tight group-hover:text-gray-700 transition">
                {siteName || "Marvelous Lifestyle"}
              </span>
              <span className="text-[9px] tracking-[0.25em] font-semibold text-gray-500 uppercase">
                Luxury Lifestyle
              </span>
            </div>
          )}
        </Link>

        {/* CENTER — Search (desktop only) */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:outline-none focus:border-gray-300 rounded-lg transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Search">
              <Search className="h-4 w-4 text-gray-400 hover:text-gray-700 transition-colors" />
            </button>
          </div>
        </form>

        {/* RIGHT — Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/wishlist"
            className="p-2 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-6 w-6 text-gray-700" />
          </Link>

          <Link
            href="/cart"
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-6 w-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <div
              className="relative"
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <button
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-50 transition-colors"
                aria-label="Account menu"
                aria-expanded={accountMenuOpen}
              >
                <User className="h-6 w-6 text-black" />
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-full w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Account
                  </Link>
                  <Link
                    href="/profile?tab=orders"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Login"
            >
              <User className="h-6 w-6 text-gray-700" />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-full hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom nav bar (desktop - Barton Bangladesh Style) ─────── */}
      <nav className="hidden lg:flex border-t border-gray-100 h-12 items-center justify-center gap-8 px-4 relative">
        {navLinks.map((link) => {
          const hasDropdown = Boolean(
            (link.has_dropdown || link.is_mega_menu) &&
            link.subcategories &&
            link.subcategories.length > 0
          );
          const topHref = normalizeNavHref(link);

          return (
            <div key={topHref + link.label} className="relative group py-3">
              <Link
                href={topHref}
                target={link.target || "_self"}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-black transition-colors"
              >
                <span>{link.label}</span>
                {hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-black group-hover:rotate-180 transition-transform duration-200" />
                )}
                {link.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white bg-red-600 rounded">
                    {link.badge}
                  </span>
                )}
              </Link>

              {hasDropdown && link.subcategories && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 w-[760px] max-w-[92vw] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden flex divide-x divide-gray-100 text-left">
                    {/* Subcategories (2 columns) */}
                    <div className="flex-1 p-6 grid grid-cols-2 gap-x-8 gap-y-5 max-h-[380px] overflow-y-auto">
                      {link.subcategories.map((sub: any) => {
                        const subHref = sub.href
                          ? sub.href.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/")
                          : `/category/${sub.slug}`;

                        return (
                          <div key={sub.id || sub.slug} className="space-y-1.5">
                            <Link
                              href={subHref}
                              className="block text-sm font-bold text-gray-900 hover:text-black transition-colors"
                            >
                              {sub.name}
                            </Link>
                            {sub.children && sub.children.length > 0 && (
                              <div className="space-y-1 pl-0 mt-1">
                                {sub.children.map((subsub: any) => {
                                  const subsubHref = (subsub as any).href
                                    ? (subsub as any).href.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/")
                                    : `/category/${subsub.slug}`;

                                  return (
                                    <Link
                                      key={subsub.id || subsub.slug}
                                      href={subsubHref}
                                      className="block text-xs text-gray-600 hover:text-black transition-colors"
                                    >
                                      {subsub.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right side Model / Featured Banner Photo */}
                    {link.featured_image && (
                      <div className="w-64 bg-gray-50 p-4 flex flex-col justify-center items-center flex-shrink-0">
                        <Link
                          href={topHref}
                          className="group/img block w-full h-full relative overflow-hidden rounded-lg shadow-sm"
                        >
                          <img
                            src={link.featured_image}
                            alt={link.label}
                            className="w-full h-56 object-cover rounded-lg transform group-hover/img:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover/img:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                            <span className="text-xs font-bold uppercase tracking-wider">{link.label}</span>
                            <span className="text-[11px] text-gray-200">Explore Collection &rarr;</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          {/* Mobile search */}
          <div className="px-4 pt-4 pb-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:outline-none focus:border-gray-300 rounded-lg transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Search">
                <Search className="h-4 w-4 text-gray-400 hover:text-gray-700 transition-colors" />
              </button>
            </form>
          </div>

          {/* Mobile nav links */}
          <nav className="flex flex-col px-4 pb-4 divide-y divide-gray-50">
            {navLinks.map((link) => {
              const hasSub = Boolean(link.subcategories && link.subcategories.length > 0);
              const isExpanded = Boolean(expandedMobileMenu[link.label]);
              const topHref = normalizeNavHref(link);

              return (
                <div key={topHref + link.label} className="py-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={topHref}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-semibold text-gray-800 hover:text-black py-1"
                    >
                      {link.label}
                    </Link>
                    {hasSub && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileMenu((prev) => ({
                            ...prev,
                            [link.label]: !prev[link.label],
                          }))
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-700"
                        aria-label="Toggle Submenu"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transform transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-black" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasSub && isExpanded && link.subcategories && (
                    <div className="pl-4 pr-1 py-2 space-y-3 bg-gray-50/50 rounded-lg mt-1">
                      {link.subcategories.map((sub: any) => {
                        const hasSubSub = Boolean(sub.children && sub.children.length > 0);
                        const isSubExpanded = Boolean(expandedMobileSubMenu[sub.name]);

                        const subHref = sub.href
                          ? sub.href.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/")
                          : `/category/${sub.slug}`;

                        return (
                          <div key={sub.id || sub.slug} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Link
                                href={subHref}
                                onClick={() => setMobileOpen(false)}
                                className="text-xs font-bold text-gray-900 hover:text-black"
                              >
                                {sub.name}
                              </Link>
                              {hasSubSub && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMobileSubMenu((prev) => ({
                                      ...prev,
                                      [sub.name]: !prev[sub.name],
                                    }))
                                  }
                                  className="p-1 text-gray-400"
                                >
                                  <ChevronDown
                                    className={`h-3 w-3 transform transition-transform duration-200 ${
                                      isSubExpanded ? "rotate-180 text-black" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {hasSubSub && isSubExpanded && sub.children && (
                              <div className="pl-3 space-y-1">
                                {sub.children.map((subsub: any) => {
                                  const subsubHref = (subsub as any).href
                                    ? (subsub as any).href.replace(/^\/categories\//, "/category/").replace(/^\/shop\?category=/, "/category/")
                                    : `/category/${subsub.slug}`;

                                  return (
                                    <Link
                                      key={subsub.id || subsub.slug}
                                      href={subsubHref}
                                      onClick={() => setMobileOpen(false)}
                                      className="block text-xs text-gray-600 hover:text-black py-0.5"
                                    >
                                      {subsub.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
