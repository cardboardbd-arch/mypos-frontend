// Shape of one row in HomeData.homepage_sections — see
// App\Http\Resources\HomepageSectionResource + HomepageService::homepageSections().
// `config` carries the type-specific settings; `products` / `items` / `content` /
// `flash_sale` are populated server-side depending on `type`.

export interface SectionProduct {
  id: number;
  // CMS product sections (featured_products/new_arrival/best_seller/...)
  // are populated via WebsiteProductCardResource (HomepageService::
  // homepageSections()), which sends `title` + a separate `product_id` —
  // not the older `name`-only ProductCardResource shape this interface
  // used to assume. Both kept optional so either resource shape type-checks.
  name?: string;
  title?: string;
  product_id?: number;
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
    available_stock?: number;
    stock_status?: string;
    can_purchase?: boolean;
  }>;
}

export interface SectionCategoryItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  banner?: string | null;
  color?: string | null;
  product_count?: number;
  children_count?: number;
}

export interface SectionCollectionItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  banner?: string | null;
  featured_image?: string | null;
  cover_image?: string | null;
  color?: string | null;
  product_count?: number;
}

export interface SectionBrandItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  logo?: string | null;
  banner?: string | null;
  cover_image?: string | null;
  color?: string | null;
  product_count?: number;
}

export interface SectionBlogItem {
  name: string;
  excerpt: string | null;
  slug: string;
  cover_image: string | null;
}

// "category_showcase" type — curated tiles (HomepageService's category_showcase
// branch), not a live catalog query: each item carries its own admin-uploaded
// image/label, only optionally tied to a real category via category_id/slug.
export interface SectionShowcaseItem {
  category_id: number | null;
  slug: string | null;
  label: string | null;
  image: string | null;
}

export interface SectionTrustItem {
  icon: string;
  title: string;
  subtitle?: string | null;
}

export interface SectionBannerItem {
  image: string | null;
  title?: string | null;
  link?: string | null;
}

export interface SectionOutletItem {
  id?: number;
  name: string;
  area?: string;
  address?: string;
  phone?: string;
  shopping_hours?: string;
  map_link?: string | null;
}

export interface RawHomepageSection {
  id: number;
  type: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  button_text?: string | null;
  view_all_link: string | null;
  category_slug: string;
  config: Record<string, any> | any[];
  products?: SectionProduct[];
  product_count?: number;
  items?: Array<SectionCategoryItem | SectionCollectionItem | SectionBrandItem | SectionBlogItem | SectionShowcaseItem | SectionTrustItem | SectionOutletItem | SectionBannerItem>;
  item_count?: number;
  content?: Record<string, any>;
  flash_sale?: { ends_at: string; items: unknown[] } | null;
}
