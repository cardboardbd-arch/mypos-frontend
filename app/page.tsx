"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { NewArrivals } from "@/components/site/NewArrivals";
import { SignatureProducts } from "@/components/site/SignatureProducts";
import { CategoryBanner } from "@/components/site/CategoryBanner";
import { DesignerGrid } from "@/components/site/DesignerGrid";
import { BigDealsBanner } from "@/components/site/BigDealsBanner";
import { FindUs } from "@/components/site/FindUs";

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

interface DesignerSection {
  title: string;
  category_slug: string;
  image: string;
  view_all_link: string;
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

interface HeroData {
  image: string | null;
  mobile_image: string | null;
  badge_text: string;
  heading: string;
  subheading: string;
  button_text: string;
  button_link: string;
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
  hero: HeroData;
  navigation?: { links: NavLink[] };
  footer?: FooterData;
  social_links?: SocialLink[];
  featured_categories: CategoryItem[];
  new_arrivals: ProductCard[];
  featured_products: ProductCard[];
  banners: Banner[];
  homepage_sections: DesignerSection[];
  promo_banner: PromoBanner | null;
  popup: any;
  store_locations: Store[];
  [key: string]: any;
}

export default function Home() {
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
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">
            Loading homepage…
          </div>
        </div>
        <Footer />
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

  return (
    <main className="bg-white text-gray-900 w-full overflow-x-hidden">
      <Nav navLinks={data.navigation?.links ?? []} />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 space-y-2 py-8">
        <Hero data={data.hero} />
        <Categories categories={data.featured_categories ?? []} />
        <NewArrivals products={data.new_arrivals ?? []} title="New Arrival" />
        <SignatureProducts products={data.featured_products ?? []} />
        <CategoryBanner banners={data.banners ?? []} />
        <DesignerGrid
          sections={data.homepage_sections ?? []}
          products={data.featured_products ?? []}
        />
        <BigDealsBanner data={data.promo_banner ?? data.popup ?? null} />
        <FindUs stores={data.store_locations ?? []} />
      </div>
      <Footer footer={data.footer} socialLinks={data.social_links} />
    </main>
  );
}
