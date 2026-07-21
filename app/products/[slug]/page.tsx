"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ShoppingCart, Heart, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart";

interface VariantAttribute {
  attribute_id: number;
  attribute_name: string;
  value_id: number;
  value: string;
}

interface Variant {
  id: number;
  sku: string;
  price: number;
  compare_price?: number;
  stock_quantity: number;
  image?: string | null;
  attributes?: VariantAttribute[];
}

/**
 * {attribute_name: value} for one variant, e.g. {Size: "M", Color: "White"}.
 * Guards against non-array `attributes` (some older variants in this system
 * still carry a legacy flat {size, color} shape instead of the current
 * [{attribute_name, value}] one) by treating anything unexpected as "no
 * attributes" rather than crashing.
 */
function attrMap(variant: Variant): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(variant.attributes)) return map;
  for (const a of variant.attributes) map[a.attribute_name] = a.value;
  return map;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  sku?: string;
  description?: string;
  short_description?: string;
  featured_image?: string | null;
  product_type: string;
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  variants: Variant[];
  gallery?: { image: string; alt_text?: string; type?: string; is_primary?: boolean }[];
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // One row per attribute name across all variants, e.g. {Size: ["S","M","L"], Color: ["White","Blue"]}.
  const attributeGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const v of product?.variants ?? []) {
      const vAttrs = attrMap(v);
      for (const [name, value] of Object.entries(vAttrs)) {
        if (!groups[name]) groups[name] = [];
        if (!groups[name].includes(value)) groups[name].push(value);
      }
    }
    return groups;
  }, [product]);

  function findVariant(attrs: Record<string, string>): Variant | undefined {
    return product?.variants.find((v) => {
      const vAttrs = attrMap(v);
      return Object.keys(attrs).every((name) => vAttrs[name] === attrs[name]);
    });
  }

  // Whether `value` for `attributeName` is reachable given what's already selected for every other attribute.
  function isAttributeValueAvailable(attributeName: string, value: string): boolean {
    return !!product?.variants.some((v) => {
      const vAttrs = attrMap(v);
      if (vAttrs[attributeName] !== value) return false;
      return Object.keys(selectedAttrs).every(
        (otherName) => otherName === attributeName || vAttrs[otherName] === selectedAttrs[otherName]
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
    if (!product || !selectedVariant) return;
    addToCart({
      id: selectedVariant.id,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.title,
      slug: product.slug,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      compare_price: selectedVariant.compare_price,
      thumbnail: product.featured_image ?? undefined,
      attributes: attrMap(selectedVariant),
      quantity: quantity,
    }, quantity);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/products/${encodeURIComponent(slug as string)}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        const p = res.data as Product;
        const firstVariant = p.variants?.[0] ?? null;
        setProduct(p);
        setSelectedVariant(firstVariant);
        setSelectedAttrs(firstVariant ? attrMap(firstVariant) : {});
        setSelectedImage(firstVariant?.image ?? p.featured_image ?? p.gallery?.[0]?.image ?? null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
        </div>
        <Footer />
      </>
    );

  if (error || !product)
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500">Product not found.</p>
          <button onClick={() => router.push("/shop")} className="px-4 py-2 bg-black text-white text-sm font-bold rounded">
            Back to Shop
          </button>
        </div>
        <Footer />
      </>
    );

  const price = selectedVariant?.price ?? product.variants?.[0]?.price ?? 0;
  const comparePrice = selectedVariant?.compare_price ?? product.variants?.[0]?.compare_price;
  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : null;

  const images = product.gallery?.length
    ? product.gallery.map((g) => g.image)
    : product.featured_image
      ? [product.featured_image]
      : [];

  return (
    <>
      <Nav />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <button onClick={() => router.push("/")} className="hover:text-black transition">
            Home
          </button>
          <ChevronRight className="h-3 w-3" />
          {product.category && (() => {
            const cat = product.category;
            return (
              <>
                <button
                  onClick={() => router.push(`/shop?category=${cat.slug}`)}
                  className="hover:text-black transition"
                >
                  {cat.name}
                </button>
                <ChevronRight className="h-3 w-3" />
              </>
            );
          })()}
          <span className="text-gray-700 font-medium line-clamp-1">
            {product.title}
          </span>
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Left: Images */}
          <div className="flex flex-col gap-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300" />
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

            {/* Attribute selectors — one row per attribute name found across
                this product's variants (Size, Color, ...). A product with a
                single variant and no attributes renders none of this. */}
            {Object.entries(attributeGroups).map(([attributeName, values]) => (
              <div key={attributeName}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {attributeName}:{" "}
                  <span className="text-black">{selectedAttrs[attributeName]}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const available = isAttributeValueAvailable(attributeName, value);
                    const isSelected = selectedAttrs[attributeName] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleSelectAttribute(attributeName, value)}
                        disabled={!available}
                        className={`min-w-12 h-12 px-3 text-xs font-bold border rounded-lg transition
                          ${isSelected ? "bg-black text-white border-black" : "border-gray-200 hover:border-black"}
                          ${!available ? "opacity-30 cursor-not-allowed line-through" : ""}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Stock */}
            <p
              className={`text-xs font-medium ${
                (selectedVariant?.stock_quantity ?? 0) > 0
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {(selectedVariant?.stock_quantity ?? 0) > 0
                ? `In Stock (${selectedVariant!.stock_quantity} available)`
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
                className="flex-1 bg-black hover:bg-gray-800 text-white py-3 text-sm font-bold uppercase tracking-wider transition rounded-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 border border-gray-200 hover:border-black text-gray-900 py-3 text-sm font-bold uppercase tracking-wider transition rounded-sm"
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
      <Footer />
    </>
  );
}
