/**
 * WP6 — pure functions turning either backend card shape into the one
 * unified shape ProductCard renders (see lib/types/product.ts's
 * ProductCardColorOption docblock). No fetching, no React — safe to
 * unit-test and safe to call from both client and server components.
 */
import type {
  WebsiteProductCard,
  LegacyProductCard,
  ProductCardColorOption,
} from "./types/product";

export function toColorOption(card: WebsiteProductCard): ProductCardColorOption {
  const firstVariant = card.variants?.[0];
  return {
    productId: card.product_id,
    slug: card.slug,
    color: card.color,
    thumbnail: card.thumbnail,
    hoverImage: card.hover_image ?? null,
    price: card.price_range?.min ?? firstVariant?.price ?? 0,
    comparePrice: firstVariant?.compare_price ?? null,
    discountPercentage: card.discount_percentage,
    availableStock: card.available_stock,
    variantId: firstVariant?.id,
    sku: firstVariant?.sku ?? card.sku,
  };
}

/**
 * A legacy (old ProductCardResource) card has no color concept — always
 * renders as a single-entry, no-selector card. `color: null` is what
 * tells ProductCard to skip the swatch row.
 */
export function legacyToColorOption(item: LegacyProductCard): ProductCardColorOption {
  const firstVariant = item.variants?.[0];
  return {
    productId: item.id,
    slug: item.slug,
    color: null,
    thumbnail: item.thumbnail,
    hoverImage: item.hover_image ?? null,
    price: item.price_range?.min ?? firstVariant?.price ?? 0,
    comparePrice: firstVariant?.compare_price ?? null,
    discountPercentage: item.discount_percentage ?? null,
    variantId: firstVariant?.id,
    sku: firstVariant?.sku ?? item.sku,
  };
}

export interface GroupedProductCard {
  productId: number;
  title: string;
  colors: ProductCardColorOption[];
}

/**
 * Mode 2 ("grouped") — merges the flat /v1/products listing (one card
 * per published color) into one entry per product_id, in first-seen
 * order. Purely a client-side presentation grouping: no extra fetch, no
 * backend change — every field a grouped card needs (color, slug,
 * cover_image, price) is already present on each flat WP4 card. Mode 1
 * ("individual") skips this entirely and renders each flat card as-is.
 */
export function groupCardsByProduct(cards: WebsiteProductCard[]): GroupedProductCard[] {
  const order: number[] = [];
  const groups = new Map<number, GroupedProductCard>();

  for (const card of cards) {
    let group = groups.get(card.product_id);
    if (!group) {
      group = { productId: card.product_id, title: card.title, colors: [] };
      groups.set(card.product_id, group);
      order.push(card.product_id);
    }
    group.colors.push(toColorOption(card));
  }

  return order.map((id) => groups.get(id)!);
}
