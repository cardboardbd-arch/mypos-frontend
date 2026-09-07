"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { CmsHomepageSections } from "@/components/site/sections/CmsHomepageSections";
import { HeroSliderSection } from "@/components/site/sections/HeroSliderSection";
import { SkeletonNav } from "@/components/site/SkeletonNav";
import { SkeletonSection } from "@/components/site/SkeletonSection";
import type { RawHomepageSection } from "@/components/site/sections/types";


interface ProductCard {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  product_type: string;
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  variants?: Array<{
    id: number;
    sku: string;
    price: number;
    compare_price?: number;
    stock_quantity: number;
    attributes?: Record<string, string>;
  }>;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

interface Banner {
  label: string;
  slug: string;
  image: string;
  link: string;
}

interface PromoBanner {
  is_active: boolean;
  heading: string;
  subheading: string;
  button_text: string;
  button_link: string;
  bg_color: string;
}

interface Store {
  name: string;
  area: string;
  address: string;
  phone: string;
  map_link?: string | null;
}

interface NavLink { label: string; href: string; }
interface FooterLink { label: string; href: string; }
interface Feature { label: string; icon?: string; }
interface SocialLink { platform: string; url: string; is_active?: boolean; }

interface FooterData {
  brand_name?: string;
  brand_tagline?: string;
  brand_description?: string;
  copyright_text?: string;
  quick_links?: FooterLink[];
  customer_links?: FooterLink[];
  feature_bar?: Feature[];
}

interface HomeData {
  site?: { name?: string | null; logo?: string | null };
  navigation?: { links: NavLink[] };
  footer?: FooterData;
  social_links?: SocialLink[];
  featured_categories: CategoryItem[];
  new_arrivals: ProductCard[];
  featured_products: ProductCard[];
  banners: Banner[];
  homepage_sections: RawHomepageSection[];
  promo_banner: PromoBanner | null;
  popup: any;
  store_locations: Store[];
  [key: string]: any;
}

/**
 * Phase 10.4P — this is the pre-existing app/page.tsx body, moved here
 * unchanged so app/page.tsx itself can become a server component and
 * export generateMetadata() (a "use client" file can't export it). No
 * behavior/design change — same fetch, same loading/error states, same
 * markup.
 */
export default function HomeClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/home`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        setData(res.data as HomeData);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="bg-white text-gray-900 w-full overflow-x-hidden">
        <SkeletonNav />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 pt-2 pb-12">
          {/* Hero skeleton */}
          <div className="skeleton w-full rounded-2xl" style={{ aspectRatio: "16/6" }} />
          {/* Product section skeletons */}
          <SkeletonSection cards={5} />
          <SkeletonSection cards={5} />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="bg-white text-gray-900 w-full overflow-x-hidden">
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">
              Unable to load homepage.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white text-sm font-bold rounded"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const heroSection = data.homepage_sections?.find((s) => s.type === "hero_slider");

  return (
    <main className="bg-white text-gray-900 w-full overflow-x-hidden">
      <Nav navLinks={data.navigation?.links ?? []} logoUrl={data.site?.logo ?? null} siteName={data.site?.name ?? null} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 pt-2 pb-12">
        {heroSection && <HeroSliderSection section={heroSection} />}
        <CmsHomepageSections sections={data.homepage_sections ?? []} />
      </div>
      <Footer footer={data.footer} socialLinks={data.social_links} showFeatureBar={false} />
    </main>
  );
}
