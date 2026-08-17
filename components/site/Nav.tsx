"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getToken } from "@/lib/auth";

interface NavLink { label: string; href: string; }

interface Props {
  /** From /v1/home's `navigation.links` — omit to have Nav self-fetch it. */
  navLinks?: NavLink[];
  /** From /v1/home's `site.logo` — omit to have Nav self-fetch it. */
  logoUrl?: string | null;
  /** From /v1/home's `site.name` — omit to have Nav self-fetch it. */
  siteName?: string | null;
}

const FALLBACK_NAV: NavLink[] = [
  { label: "Shop",         href: "/shop" },
  { label: "Categories",   href: "/categories" },
  { label: "Brands",       href: "/brands" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Sale",         href: "/shop?sale=true" },
];

export function Nav({ navLinks: navLinksProp, logoUrl: logoUrlProp, siteName: siteNameProp }: Props = {}) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(navLinksProp?.length ? navLinksProp : FALLBACK_NAV);
  // Admin-uploaded logo/site name (GeneralSettings). null/undefined means
  // "no logo configured" — the static PIXELIZZ wordmark stays as the
  // fallback, it's never left blank.
  const [logoUrl, setLogoUrl] = useState<string | null>(logoUrlProp ?? null);
  const [siteName, setSiteName] = useState<string | null>(siteNameProp ?? null);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    if (navLinksProp !== undefined || logoUrlProp !== undefined || siteNameProp !== undefined) {
      // The homepage already fetched /v1/home itself and passed these
      // down — no second request needed.
      if (navLinksProp && navLinksProp.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNavLinks(navLinksProp);
      }
      if (logoUrlProp !== undefined) {
        setLogoUrl(logoUrlProp);
      }
      if (siteNameProp !== undefined) {
        setSiteName(siteNameProp);
      }
      return;
    }
    // No props (every page other than the homepage) — reuse the same
    // aggregated endpoint rather than the retired /v1/cms/navigation (see
    // docs/theme-contract.md, mypos repo) for nav links, logo, and site name.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/home`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => {
        const items = res.data?.navigation?.links;
        if (items?.length) setNavLinks(items);
        if (res.data?.site?.logo) setLogoUrl(res.data.site.logo);
        if (res.data?.site?.name) setSiteName(res.data.site.name);
      })
      .catch(() => {/* keep fallback */});
  }, [navLinksProp, logoUrlProp, siteNameProp]);

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="h-20 flex items-center justify-between max-w-[1440px] mx-auto px-4">

        {/* LEFT — Logo */}
        <Link href="/">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={siteName ?? "Pixelizz"}
              className="h-12 w-auto object-contain px-4 py-1"
            />
          ) : (
            <div className="flex flex-col items-center px-4 py-1">
              <span className="font-black text-3xl tracking-tighter leading-none bg-black text-white px-2 py-1 rounded">
                PIXELIZZ
              </span>
              <span className="text-[10px] tracking-[0.4em] font-bold mt-1 text-black">
                BUSINESS OS
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

          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className="p-2 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Account"
          >
            <User className={`h-6 w-6 ${isLoggedIn ? "text-black" : "text-gray-700"}`} />
          </Link>

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

      {/* ── Bottom nav bar (desktop) ─────────────────────────────────── */}
      <nav className="hidden lg:flex border-t border-gray-100 h-12 items-center justify-center gap-10">
        {navLinks.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium hover:text-gray-500 transition-colors"
          >
            {label}
          </Link>
        ))}
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
          <nav className="flex flex-col px-4 pb-4">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-medium border-b border-gray-50 last:border-0 hover:text-gray-500 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
