"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SOCIAL_SVGS: Record<string, string> = {
  facebook:  `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  twitter:   `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  youtube:   `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s-6.88 0-8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>`,
  tiktok:    `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.67a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.01-.03z"/></svg>`,
  whatsapp:  `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.56 4.14 1.543 5.868L0 24l6.293-1.52A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.38l-.36-.213-3.733.902.938-3.625-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.581 6.581 2.182 12 2.182S21.818 6.581 21.818 12 17.419 21.818 12 21.818z"/></svg>`,
  linkedin:  `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>`,
};

interface Feature    { label: string; icon?: string; }
interface FooterLink { label: string; href: string; }
interface SocialLink { platform: string; url: string; is_active?: boolean; }
interface Brand      { name: string; tagline: string; description: string; copyright: string; }

/** Shape of /v1/home's `footer` field. */
interface FooterData {
  brand_name?: string;
  brand_tagline?: string;
  brand_description?: string;
  copyright_text?: string;
  quick_links?: FooterLink[];
  customer_links?: FooterLink[];
  feature_bar?: Feature[];
}

interface Props {
  /** From /v1/home — omit to have Footer self-fetch it. */
  footer?: FooterData;
  socialLinks?: SocialLink[];
  showFeatureBar?: boolean;
}

const FB_FEATURES: Feature[] = [
  { icon: "🏷️", label: "100+ BRANDS" },
  { icon: "🚚", label: "FREE DELIVERY" },
  { icon: "💬", label: "CUSTOMER SERVICE" },
  { icon: "🔒", label: "SECURE PAYMENT" },
];
const FB_QUICK_LINKS: FooterLink[] = [
  { label: "Home",         href: "/" },
  { label: "Shop",         href: "/shop" },
  { label: "Categories",   href: "/categories" },
  { label: "Brands",       href: "/brands" },
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "About Us",     href: "/about" },
  { label: "FAQ",          href: "/faq" },
];
const FB_CUSTOMER_LINKS: FooterLink[] = [
  { label: "My Account",   href: "/profile" },
  { label: "Track Order",  href: "/track-order" },
  { label: "Wishlist",     href: "/wishlist" },
  { label: "Return Policy",href: "/return-policy" },
  { label: "Contact Us",   href: "/contact" },
];
const FB_SOCIAL_LINKS: SocialLink[] = [
  { platform: "facebook",  url: "#" },
  { platform: "instagram", url: "#" },
  { platform: "twitter",   url: "#" },
  { platform: "youtube",   url: "#" },
];
const FB_BRAND: Brand = {
  name: "Marvelous Lifestyle",
  tagline: "Bangladesh's Luxury Lifestyle Brand",
  description: "Your one-stop destination for quality products at the best prices. Shop smart, live better.",
  copyright: "© 2026 Marvelous Lifestyle. All rights reserved.",
};

export function Footer({ footer: footerProp, socialLinks: socialLinksProp, showFeatureBar = true }: Props = {}) {
  const [features,      setFeatures]      = useState<Feature[]>(FB_FEATURES);
  const [quickLinks,    setQuickLinks]    = useState<FooterLink[]>(FB_QUICK_LINKS);
  const [customerLinks, setCustomerLinks] = useState<FooterLink[]>(FB_CUSTOMER_LINKS);
  const [socialLinks,   setSocialLinks]   = useState<SocialLink[]>(FB_SOCIAL_LINKS);
  const [brand,         setBrand]         = useState<Brand>(FB_BRAND);

  function applyFooterData(d?: FooterData, socials?: SocialLink[]) {
    if (d) {
      if (d.feature_bar?.length)       setFeatures(d.feature_bar);
      if (d.quick_links?.length)       setQuickLinks(d.quick_links);
      if (d.customer_links?.length)    setCustomerLinks(d.customer_links);
      if (d.brand_name || d.brand_tagline || d.brand_description || d.copyright_text) {
        setBrand({
          name: d.brand_name ?? FB_BRAND.name,
          tagline: d.brand_tagline ?? FB_BRAND.tagline,
          description: d.brand_description ?? FB_BRAND.description,
          copyright: d.copyright_text ?? FB_BRAND.copyright,
        });
      }
    }
    if (socials?.length) {
      setSocialLinks(socials.filter((s) => s.is_active !== false));
    }
  }

  useEffect(() => {
    if (footerProp || socialLinksProp) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyFooterData(footerProp, socialLinksProp);
      return;
    }
    // No props (every page other than the homepage, which already fetched
    // /v1/home itself) — reuse the same aggregated endpoint rather than the
    // retired /v1/cms/footer (see docs/theme-contract.md, mypos repo).
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/home`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => applyFooterData(res.data?.footer, res.data?.social_links))
      .catch(() => {/* keep fallback */});
  }, [footerProp, socialLinksProp]);

  return (
    <footer className="bg-black text-white mt-8">
      {showFeatureBar && (
        <div className="bg-[#cc0000]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-red-700">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-center gap-2 py-3 px-4"
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-xs font-bold tracking-widest text-white">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div>
              <p className="text-xl font-black tracking-tight">{brand.name}</p>
              <p className="text-[9px] tracking-[0.25em] text-gray-400 uppercase mt-0.5">
                {brand.tagline}
              </p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {brand.description}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  aria-label={s.platform}
                  className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-colors"
                  dangerouslySetInnerHTML={{ __html: SOCIAL_SVGS[s.platform] ?? "" }}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2">
              {customerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to get the latest deals and product updates.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-gray-400 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>{brand.copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/return-policy" className="hover:text-gray-300 transition-colors">Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
