/**
 * WP6 — shared types for the color-aware storefront (backend WP1-5).
 *
 * Two families of shapes exist server-side right now, and both are
 * represented here on purpose (not unified into one "ideal" shape):
 *
 * - WebsiteProductCard / WebsiteProductDetail / SiblingColor — the NEW
 *   per-color shape, returned ONLY by /v1/products and /v1/products/{slug}
 *   (backend WP4). One card = one published color (or one null-color
 *   item for a non-fashion/single-color product).
 *
 * - LegacyProductCard — the OLDER style-level shape (ProductCardResource),
 *   still returned by /v1/search, /v1/collections/{slug}/products, and
 *   every /v1/home product section (featured_products, new_arrivals,
 *   best_sellers, CMS product carousels). Backend WP4/WP5 deliberately
 *   did not touch these endpoints — see the WP6 report for the full
 *   list of places this shows up. `name` (not `title`) and no `color`
 *   field are the two things that distinguish it from the new shape.
 */

export interface ColorOption {
  id: number;
  name: string;
  color_code: string | null;
}

export interface VariantAttribute {
  attribute_id?: number;
  attribute_name: string;
  value_id?: number;
  value: string;
}

export interface VariantSummary {
  id: number;
  sku: string;
  price: number;
  // Nullable AND optional: the new WP4 shape always sends null when
  // absent, but several pre-existing local interfaces across the
  // frontend (SectionProduct, the old shop-page Product type, ...)
  // mark this as simply-absent (undefined) instead — tolerating both
  // avoids forcing an unrelated rewrite of those call sites.
  compare_price?: number | null;
  available_stock?: number;
  stock_status?: string;
  can_purchase?: boolean;
  stock_quantity?: number;
  attributes?: VariantAttribute[];
  status?: string;
  image?: string | null;
}

export interface CategoryRef {
  id?: number;
  name: string;
  slug: string;
}

export interface BrandRef {
  id?: number;
  name: string;
  slug: string;
}

export interface ProductTemplateRef {
  id: number;
  name: string;
  slug: string;
  has_variants: boolean;
  sections: unknown[];
  attribute_ids: number[];
  attribute_group_ids: number[];
}

/** /v1/products listing card — one per PUBLISHED color (WP4). */
export interface WebsiteProductCard {
  id: number; // website_products.id — NOT products.id
  slug: string; // website_products.slug — this color's own page URL
  product_id: number; // the underlying style — use to group in "grouped" mode
  sku?: string;
  title: string; // plain style name, never concatenated with color server-side
  color: ColorOption | null; // null = non-fashion / single-color item
  thumbnail: string | null;
  /** Second image shown on hover in the product card (optional). */
  hover_image?: string | null;
  product_type: string;
  category: CategoryRef | null;
  brand: BrandRef | null;
  variants: VariantSummary[]; // only THIS color's variants
  price_range: { min: number | null; max: number | null };
  discount_percentage: number | null;
  available_stock: number;
  is_new_arrival: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  product_template: ProductTemplateRef | null;
}

/** Lightweight cross-page color-switcher entry (WP4's sibling_colors). */
export interface SiblingColor {
  slug: string;
  color: ColorOption | null;
  cover_image: string | null;
}

export interface SeoBlock {
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords?: string | null;
  canonical: string;
  og_image: string | null;
  robots: string;
}

export interface GalleryImage {
  image: string;
  alt_text: string | null;
  is_primary: boolean;
}

/** /v1/products/{slug} — ONE color's full detail page (WP4). */
export interface WebsiteProductDetail {
  id: number;
  slug: string;
  product_id: number;
  sku?: string;
  title: string;
  product_type: string;
  color: ColorOption | null;

  short_description: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  highlights: Array<{ text: string }> | null;
  care_instructions: string | null;
  size_guide: string | null;

  category: CategoryRef | null;
  brand: BrandRef | null;

  featured_image: string | null;
  gallery: GalleryImage[]; // THIS color's own gallery (website_product_images)

  price: number | null;
  sale_price: number | null;

  available_stock: number;
  stock_status: string;
  can_purchase: boolean;
  availability_message?: string;

  variants: VariantSummary[]; // only THIS color's variants (its Size options)

  sibling_colors: SiblingColor[]; // other PUBLISHED colors — cross-page nav only

  tags: Array<{ id: number; name: string; slug: string }>;
  collections: Array<{ id: number; title: string; slug: string }>;
  related_products: WebsiteProductCard[];

  breadcrumbs: Array<{ label: string; href: string }>;
  seo: SeoBlock | null;

  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;

  product_template: ProductTemplateRef | null;
  currency: { code: string; symbol: string };
}

/**
 * Older style-level shape (ProductCardResource) — /v1/search,
 * /v1/collections/{slug}/products, /v1/home's product sections. No
 * `color` field exists here at all; `variants[]` spans every color of
 * the style together.
 */
export interface LegacyProductCard {
  id: number; // products.id
  name: string; // NOT `title`
  slug: string; // products.slug
  sku?: string;
  thumbnail: string | null;
  /** Second image shown on hover in the product card (optional). */
  hover_image?: string | null;
  product_type: string;
  category?: CategoryRef;
  brand?: BrandRef;
  variants?: VariantSummary[];
  price_range?: { min: number | null; max: number | null };
  discount_percentage?: number | null;
  is_new_arrival?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  product_template?: ProductTemplateRef;
}

/**
 * Unified per-color entry ProductCard renders internally — every card
 * source (new WP4 cards, grouped WP4 cards, legacy old-shape cards)
 * gets normalized into this shape before reaching the component, via
 * lib/product-adapters.ts. `color: null` means "no selector for this
 * entry" (single-color item, or a legacy card with no color concept).
 */
export interface ProductCardColorOption {
  productId: number;
  slug: string;
  color: ColorOption | null;
  thumbnail: string | null;
    hoverImage?: string | null;
  price: number;
  comparePrice: number | null;
  discountPercentage: number | null;
  availableStock?: number;
  variantId?: number; // representative variant (first) for quick add-to-cart
  sku?: string;
}

/** WP5 — from /v1/home's theme block. */
export type ProductDisplayMode = "individual" | "grouped";

export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  logo: string | null;
  favicon: string | null;
  font: string;
  layout: string;
  product_display_mode: ProductDisplayMode;
}
