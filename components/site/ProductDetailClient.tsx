"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { ColorSelector } from "@/components/site/ColorSelector";
import { SizeSelector } from "@/components/site/SizeSelector";
import type { ColorOption, VariantSummary, WebsiteProductDetail } from "@/lib/types/product";

/**
 * {attribute_name: value} for one variant, e.g. {Size: "M"}. "Color" is
 * deliberately excluded from this map's use in attribute grouping below
 * — every variant on this page already belongs to the SAME color (the
 * backend scopes `variants` to just this website_product's color), so a
 * Color entry here would be redundant with (and could conflict with) the
 * real color switcher, which is sibling_colors + cross-page navigation,
 * not a value picked from these variants.
 */
function attrMap(variant: VariantSummary): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(variant.attributes)) return map;
  for (const a of variant.attributes) map[a.attribute_name] = a.value;
  return map;
}

interface ProductDetailClientProps {
  initialProduct: WebsiteProductDetail;
}

export function ProductDetailClient({ initialProduct }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const product = initialProduct;

  const [selectedVariant, setSelectedVariant] = useState<VariantSummary | null>(product.variants?.[0] ?? null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    product.variants?.[0] ? attrMap(product.variants[0]) : {}
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(
    product.variants?.[0]?.image ?? product.featured_image ?? product.gallery?.[0]?.image ?? null
  );
  const [quantity, setQuantity] = useState(1);

  // WP6 requirement #4: color is CROSS-PAGE navigation on the PDP — each
  // slug only ever carries one color's variants, unlike a grouped
  // listing card where every color's data is already present. The
  // current color is included alongside sibling_colors so the selector
  // shows the full set with the current one visibly selected.
  const colorEntries = useMemo(
    () => [
      { slug: product.slug, color: product.color },
      ...product.sibling_colors.map((s) => ({ slug: s.slug, color: s.color })),
    ],
    [product.slug, product.color, product.sibling_colors]
  );
  const colorOptions: ColorOption[] = colorEntries
    .map((e) => e.color)
    .filter((c): c is ColorOption => c !== null);
  const selectedColorIndex = 0; // product.slug (current page) is always first

  function handleSelectColor(index: number) {
    const target = colorEntries[index];
    if (!target || target.slug === product.slug) return;
    router.push(`/products/${target.slug}`);
  }

  // One row per non-Color attribute name across this color's variants
  // (Size, Material, ...). WP6 requirement #5: local state only, no
  // navigation — this resolves a different variant of the SAME color.
  const attributeGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const v of product.variants ?? []) {
      const vAttrs = attrMap(v);
      for (const [name, value] of Object.entries(vAttrs)) {
        if (name === "Color") continue;
        if (!groups[name]) groups[name] = [];
        if (!groups[name].includes(value)) groups[name].push(value);
      }
    }
    return groups;
  }, [product.variants]);

  function findVariant(attrs: Record<string, string>): VariantSummary | undefined {
    return product.variants?.find((v) => {
      const vAttrs = attrMap(v);
      return Object.keys(attrs).every((name) => vAttrs[name] === attrs[name]);
    });
  }

  function isAttributeValueAvailable(attributeName: string, value: string): boolean {
    return !!product.variants?.some((v) => {
      const vAttrs = attrMap(v);
      if (vAttrs[attributeName] !== value) return false;
      return Object.keys(selectedAttrs).every(
        (otherName) => otherName === attributeName || otherName === "Color" || vAttrs[otherName] === selectedAttrs[otherName]
      );
    });
  }

  function handleSelectAttribute(attributeName: string, value: string) {
    if (!isAttributeValueAvailable(attributeName, value)) return;
    const nextAttrs = { ...selectedAttrs, [attributeName]: value };
    const variant = findVariant(nextAttrs);
    if (!variant) return;
    setSelectedAttrs(nextAttrs);
    setSelectedVariant(variant);
    if (variant.image) setSelectedImage(variant.image);
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addToCart({
      id: selectedVariant.id,
      productId: product.product_id,
      variantId: selectedVariant.id,
      name: product.title,
      slug: product.slug,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      compare_price: selectedVariant.compare_price ?? undefined,
      thumbnail: product.featured_image ?? undefined,
      attributes: attrMap(selectedVariant),
      quantity,
    }, quantity);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  const price = selectedVariant?.price ?? product.price ?? 0;
  const comparePrice = selectedVariant?.compare_price ?? product.sale_price;
  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : null;

  const images = product.gallery?.length
    ? product.gallery.map((g) => g.image)
    : product.featured_image
      ? [product.featured_image]
      : [];

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        {product.breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {i === product.breadcrumbs.length - 1 ? (
              <span className="text-gray-700 font-medium line-clamp-1">{crumb.label}</span>
            ) : (
              <button onClick={() => router.push(crumb.href)} className="hover:text-black transition">
                {crumb.label}
              </button>
            )}
          </span>
        ))}
      </nav>

      {/*
        Main Grid — 53.5%/46.5% split via fr units (not raw percentages,
        so gap is naturally subtracted from the track-sizing pass rather
        than the columns overflowing it), matching a standard fashion PDP's
        image-slightly-larger-than-details balance. Breakpoint is `md`
        (768px) rather than `lg` (1024px) so tablet-width screens — plenty
        of horizontal room — get the side-by-side layout too instead of a
        single full-width stacked column; below `md`, image stacks above
        details exactly as before.
      */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-10 lg:gap-12">

        {/* Left: Images */}
        <div className="flex flex-col gap-3">
          {/*
            3:4 portrait (not 1:1 square) — the standard aspect for fashion
            product photography (a person/garment shot), so a normal photo
            fills the frame instead of being letterboxed or center-cropped
            into a square. Width is bound by the grid column above (already
            capped by the page's max-w-[1400px]), so height follows
            proportionally — no separate max-height needed.
          */}
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-300">
                <ShoppingCart className="h-12 w-12" />
                <span className="text-xs font-medium text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail gallery */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === img ? "border-black" : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex flex-col gap-5">
          {product.brand && (
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {product.brand.name}
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {product.title}
            {product.color && (
              <span className="text-gray-400 font-normal"> — {product.color.name}</span>
            )}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-gray-900">
              Tk {price.toLocaleString()}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-base text-gray-400 line-through">
                Tk {comparePrice.toLocaleString()}
              </span>
            )}
            {discount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-sm text-gray-500 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Color — cross-page navigation (see handleSelectColor) */}
          {colorOptions.length > 1 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Color: <span className="text-black">{product.color?.name}</span>
              </p>
              <ColorSelector
                colors={colorOptions}
                selectedIndex={selectedColorIndex}
                onSelect={handleSelectColor}
                size="md"
              />
            </div>
          )}

          {/* Non-color attribute selectors (Size, ...) — local state only */}
          {Object.entries(attributeGroups).map(([attributeName, values]) => (
            <SizeSelector
              key={attributeName}
              attributeName={attributeName}
              values={values}
              selectedValue={selectedAttrs[attributeName]}
              isValueAvailable={(value) => isAttributeValueAvailable(attributeName, value)}
              onSelect={(value) => handleSelectAttribute(attributeName, value)}
            />
          ))}

          {/* Stock */}
          <p
            className={`text-xs font-medium ${
              selectedVariant?.can_purchase ? "text-green-600" : "text-red-500"
            }`}
          >
            {selectedVariant?.can_purchase
              ? `In Stock (${selectedVariant.available_stock ?? 0} available)`
              : "Out of Stock"}
          </p>

          {/* Quantity */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Quantity
            </p>
            <div className="flex items-center border border-gray-200 rounded-lg w-fit">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg font-bold hover:bg-gray-50 transition rounded-l-lg"
              >
                −
              </button>
              <span className="px-6 py-2 text-sm font-bold border-x border-gray-200">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-2 text-lg font-bold hover:bg-gray-50 transition rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant?.can_purchase}
              className="flex-1 bg-black hover:bg-gray-800 text-white py-3 text-sm font-bold uppercase tracking-wider transition rounded-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-black"
            >
              <ShoppingCart className="h-4 w-4" /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.can_purchase}
              className="flex-1 border border-gray-200 hover:border-black text-gray-900 py-3 text-sm font-bold uppercase tracking-wider transition rounded-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200"
            >
              Add to Cart
            </button>
            <button className="border border-gray-200 hover:border-red-400 hover:text-red-400 text-gray-400 px-4 py-3 transition rounded-sm">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 mt-2">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="text-lg">🚚</span>
              <div>
                <p className="font-bold text-gray-900">Free Delivery</p>
                <p className="text-gray-400">Dhaka: 1-2 days | Outside: 3-5 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="text-lg">↩️</span>
              <div>
                <p className="font-bold text-gray-900">Easy Returns</p>
                <p className="text-gray-400">7 day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-bold text-gray-900">100% Authentic</p>
                <p className="text-gray-400">Genuine product guaranteed</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-100 pt-5 mt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
                Product Details
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailClient;
