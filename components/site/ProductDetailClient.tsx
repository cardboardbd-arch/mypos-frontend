"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  ChevronRight,
  Star,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Lock,
  Maximize2,
  Award,
  Headphones,
  RulerIcon,
  Check,
  X,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import type {
  ColorOption,
  VariantSummary,
  WebsiteProductCard,
  WebsiteProductDetail,
} from "@/lib/types/product";

/* ------------------------------------------------------------------ helpers */

function attrMap(variant: VariantSummary): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(variant.attributes)) return map;
  for (const a of variant.attributes) map[a.attribute_name] = a.value;
  return map;
}

const TABS = [
  "Description",
  "Additional Information",
  "Reviews",
  "Shipping & Returns",
] as const;
type Tab = (typeof TABS)[number];

/* --------------------------------------------------------------- StarRow */

function StarRow({ rating = 4.8, count = 128 }: { rating?: number; count?: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= full ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
      <span className="text-amber-500 font-bold text-xs ml-0.5">{rating}</span>
      <span className="text-gray-300 text-xs">|</span>
      <span className="text-gray-400 text-xs">{count} Reviews</span>
      <span className="text-gray-300 text-xs">|</span>
      <span className="text-gray-400 text-xs">256 Sold</span>
    </div>
  );
}

/* ------------------------------------------------------------- LightboxModal */

function LightboxModal({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close fullscreen"
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition z-20"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition z-20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        <img
          src={images[idx]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain rounded-lg select-none shadow-2xl"
        />
      </div>

      {images.length > 1 && (
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition z-20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                i === idx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================== main component */

interface ProductDetailClientProps {
  initialProduct: WebsiteProductDetail;
}

export function ProductDetailClient({ initialProduct }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const product = initialProduct;

  const [activeTab, setActiveTab] = useState<Tab>("Description");
  const [selectedVariant, setSelectedVariant] = useState<VariantSummary | null>(
    product.variants?.[0] ?? null
  );
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    product.variants?.[0] ? attrMap(product.variants[0]) : {}
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(
    product.variants?.[0]?.image ??
      product.gallery?.[0]?.image ??
      product.featured_image ??
      null
  );
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  /* color (cross-page) */
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

  function handleSelectColor(index: number) {
    const target = colorEntries[index];
    if (!target || target.slug === product.slug) return;
    router.push(`/products/${target.slug}`);
  }

  /* attribute groups */
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
        (k) => k === attributeName || k === "Color" || vAttrs[k] === selectedAttrs[k]
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
    addToCart(
      {
        id: selectedVariant.id,
        productId: product.product_id || (product as any).id,
        variantId: selectedVariant.id,
        name: product.title,
        slug: product.slug,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        compare_price: selectedVariant.compare_price ?? undefined,
        thumbnail: product.featured_image ?? undefined,
        attributes: attrMap(selectedVariant),
        quantity,
      },
      quantity
    );
  }

  async function handleBuyNow() {
    if (!selectedVariant) return;
    await addToCart(
      {
        id: selectedVariant.id,
        productId: product.product_id || (product as any).id,
        variantId: selectedVariant.id,
        name: product.title,
        slug: product.slug,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        compare_price: selectedVariant.compare_price ?? undefined,
        thumbnail: product.featured_image ?? undefined,
        attributes: attrMap(selectedVariant),
        quantity,
      },
      quantity
    );
    router.push("/checkout");
  }

  /* pricing */
  const price = selectedVariant?.price ?? product.price ?? 0;
  const comparePrice = selectedVariant?.compare_price ?? product.sale_price;
  const hasDiscount = !!(comparePrice && comparePrice > price);
  const discount = hasDiscount
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : null;
  const savings = hasDiscount ? comparePrice! - price : null;
  const sym = product.currency?.symbol ?? "৳";

  /* images */
  const images = product.gallery?.length
    ? product.gallery.map((g) => g.image)
    : product.featured_image
      ? [product.featured_image]
      : [];

  /* zoom state */
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  /* lightbox modal */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function openLightbox() {
    const idx = images.indexOf(selectedImage ?? "");
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }

  /* thumbnail slider (4 limit) */
  const VISIBLE_THUMBS = 4;
  const [thumbStartIndex, setThumbStartIndex] = useState(0);

  useEffect(() => {
    if (!selectedImage) return;
    const idx = images.indexOf(selectedImage);
    if (idx !== -1) {
      if (idx < thumbStartIndex) {
        setThumbStartIndex(idx);
      } else if (idx >= thumbStartIndex + VISIBLE_THUMBS) {
        setThumbStartIndex(
          Math.min(
            idx - (VISIBLE_THUMBS - 1),
            Math.max(0, images.length - VISIBLE_THUMBS)
          )
        );
      }
    }
  }, [selectedImage, images]);

  /* stock */
  const inStock = product.stock_status !== "out_of_stock";
  const lowStock = product.stock_status === "low_stock";

  /* specifications */
  const specifications = useMemo(() => {
    if (product.specifications && typeof product.specifications === "object") {
      return Object.entries(product.specifications as Record<string, string>);
    }
    return [];
  }, [product.specifications]);

  /* highlights */
  const highlights = useMemo(() => {
    if (!product.highlights) return [];
    return Array.isArray(product.highlights)
      ? product.highlights.map((h) => (typeof h === "string" ? h : h.text))
      : [];
  }, [product.highlights]);

  /* ============================================================== render */
  return (
    <div className="bg-white min-h-screen">
      {/* Lightbox Modal */}
      {lightboxOpen && images.length > 0 && (
        <LightboxModal
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-5">

        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap gap-1 text-xs text-gray-400 mb-5">
          {product.breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              {i === product.breadcrumbs.length - 1 ? (
                <span className="text-gray-600 font-medium">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => router.push(crumb.href)}
                  className="hover:text-gray-700 transition"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT: Images */}
          <div className="flex gap-3">
            {images.length > 0 && (
              <div
                className="flex flex-col items-center gap-2 w-[100px] sm:w-[115px] md:w-[125px] lg:w-[130px] shrink-0 select-none"
                onWheel={(e) => {
                  if (images.length <= VISIBLE_THUMBS) return;
                  if (e.deltaY > 0) {
                    setThumbStartIndex((prev) =>
                      Math.min(images.length - VISIBLE_THUMBS, prev + 1)
                    );
                  } else if (e.deltaY < 0) {
                    setThumbStartIndex((prev) => Math.max(0, prev - 1));
                  }
                }}
              >
                {images.length > VISIBLE_THUMBS && (
                  <button
                    type="button"
                    onClick={() =>
                      setThumbStartIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={thumbStartIndex === 0}
                    aria-label="Previous thumbnails"
                    className="w-full py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-gray-50 flex items-center justify-center text-gray-700 transition border border-gray-200/80"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                )}

                <div className="flex flex-col gap-3 w-full">
                  {images
                    .slice(thumbStartIndex, thumbStartIndex + VISIBLE_THUMBS)
                    .map((img, i) => {
                      const actualIdx = thumbStartIndex + i;
                      const isSelected = selectedImage === img;
                      return (
                        <button
                          key={actualIdx}
                          onClick={() => setSelectedImage(img)}
                          className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? "border-2 border-gray-900 shadow-sm ring-1 ring-gray-900"
                              : "border border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.title} ${actualIdx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                </div>

                {images.length > VISIBLE_THUMBS && (
                  <button
                    type="button"
                    onClick={() =>
                      setThumbStartIndex((prev) =>
                        Math.min(images.length - VISIBLE_THUMBS, prev + 1)
                      )
                    }
                    disabled={
                      thumbStartIndex >= images.length - VISIBLE_THUMBS
                    }
                    aria-label="Next thumbnails"
                    className="w-full py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-gray-50 flex items-center justify-center text-gray-700 transition border border-gray-200/80"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Main image — hover zoom + click for fullscreen */}
            <div
              className={`relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 group select-none ${
                selectedImage ? "cursor-crosshair" : ""
              }`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={selectedImage ? openLightbox : undefined}
            >
              {discount && (
                <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded pointer-events-none">
                  -{discount}%
                </div>
              )}
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  draggable={false}
                  className="h-full w-full object-cover select-none pointer-events-none transition-transform duration-100 ease-out"
                  style={{
                    transform: isZoomed ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-200">
                  <ShoppingCart className="h-14 w-14" />
                  <span className="text-sm text-gray-300">No image</span>
                </div>
              )}
              {selectedImage && !isZoomed && (
                <div className="absolute bottom-3 left-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-md">
                    Hover to zoom &bull; Click to expand
                  </span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox();
                }}
                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white transition shadow-sm z-10"
              >
                <Maximize2 className="h-3.5 w-3.5" /> View Fullscreen
              </button>
            </div>
          </div>

          {/* RIGHT: Info */}
          <div className="flex flex-col gap-4">

            {/* Stock + SKU */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
                inStock
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-red-50 text-red-500 border-red-200"
              }`}>
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
              {selectedVariant?.sku && (
                <span className="text-xs text-gray-400">SKU: {selectedVariant.sku}</span>
              )}
            </div>

            {/* Title + Brand */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {product.title}
              </h1>
              {product.brand && (
                <p className="text-sm text-gray-400 mt-1">{product.brand.name}</p>
              )}
            </div>

            <StarRow />

            {/* Price box */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-black text-red-500">
                  {sym}{price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">
                    {sym}{comparePrice!.toLocaleString()}
                  </span>
                )}
                {discount && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                )}
              </div>
              {savings && (
                <p className="text-green-600 text-xs font-semibold mt-1.5">
                  You save {sym}{savings.toLocaleString()} ({discount}%)
                </p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Color */}
            {colorOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">
                  Color: <span className="font-normal text-gray-500">{product.color?.name ?? "—"}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colorEntries.map((entry, i) => {
                    if (!entry.color) return null;
                    const isSelected = entry.slug === product.slug;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectColor(i)}
                        title={entry.color.name}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 scale-110"
                            : "border-gray-300 hover:border-gray-600"
                        }`}
                        style={{ backgroundColor: entry.color.color_code ?? "#ccc" }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attribute selectors (Size etc.) */}
            {Object.entries(attributeGroups).map(([attributeName, values]) => (
              <div key={attributeName}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-semibold text-gray-700">
                    {attributeName}: <span className="font-normal text-gray-500">{selectedAttrs[attributeName] ?? "—"}</span>
                  </p>
                  {attributeName.toLowerCase() === "size" && product.size_guide && (
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 transition cursor-pointer"
                    >
                      <RulerIcon className="h-3 w-3" /> Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const available = isAttributeValueAvailable(attributeName, value);
                    const selected = selectedAttrs[attributeName] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleSelectAttribute(attributeName, value)}
                        disabled={!available}
                        className={`min-w-[44px] px-4 py-1.5 text-sm font-semibold rounded border transition-all ${
                          selected
                            ? "bg-gray-900 text-white border-gray-900"
                            : available
                              ? "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
                              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Quantity:</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold border-x border-gray-200 h-10 flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                </div>
                {lowStock && product.available_stock > 0 && (
                  <span className="text-orange-500 text-xs font-semibold">
                    Only {product.available_stock} items left!
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-1">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || !selectedVariant}
                className="flex-1 bg-gray-900 hover:bg-gray-700 active:bg-black text-white py-3.5 text-sm font-bold uppercase tracking-wider transition rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock || !selectedVariant}
                className="flex-1 border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 py-3.5 text-sm font-bold uppercase tracking-wider transition rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Wishlist + Compare */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button className="flex items-center gap-1.5 hover:text-red-500 transition">
                <Heart className="h-4 w-4" /> Add to Wishlist
              </button>
              <button className="flex items-center gap-1.5 hover:text-blue-500 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Compare
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Bar */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-100 rounded-2xl p-4 md:p-5">
          {([
            { icon: Truck,       title: "Free Shipping",  sub: "On orders over " + sym + "1,999" },
            { icon: RefreshCcw,  title: "Easy Returns",   sub: "7 days return policy" },
            { icon: ShieldCheck, title: "100% Original",  sub: "Quality assured products" },
            { icon: Lock,        title: "Secure Payment", sub: "100% secure payment" },
          ] as const).map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{title}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                    activeTab === tab
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "Reviews" ? "Reviews (128)" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div>
              {activeTab === "Description" && (
                <div className="space-y-4">
                  {product.short_description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
                  )}
                  {highlights.length > 0 && (
                    <ul className="space-y-2">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {product.description && (
                    <div
                      className="product-description text-sm text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                  {product.care_instructions && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 mb-1">Care Instructions</p>
                      <p className="text-xs text-blue-600 leading-relaxed">{product.care_instructions}</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Additional Information" && (
                <p className="text-sm text-gray-500 py-4">Additional product information will be available soon.</p>
              )}
              {activeTab === "Reviews" && (
                <p className="text-sm text-gray-500 py-4">Customer reviews will be shown here.</p>
              )}
              {activeTab === "Shipping & Returns" && (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-gray-600">
                    <strong>Free shipping</strong> on orders over {sym}1,999. Delivery within 1-5 business days.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Easy 7-day returns.</strong> Item must be unused and in original packaging.
                  </p>
                </div>
              )}
            </div>

            {specifications.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 self-start">
                <div className="divide-y divide-gray-100">
                  {specifications.map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 py-2.5 text-sm">
                      <span className="text-gray-400 w-[110px] shrink-0 text-xs mt-0.5">{key}</span>
                      <span className="text-gray-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {product.related_products && product.related_products.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">You Might Also Like</h2>
              <Link href="/shop" className="text-sm text-blue-500 hover:underline font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.related_products.slice(0, 4).map((rp: WebsiteProductCard) => {
                const rpPrice = rp.price_range?.min ?? rp.variants?.[0]?.price ?? 0;
                const rpCompare = rp.variants?.[0]?.compare_price ?? null;
                const rpDiscount = rp.discount_percentage;
                return (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[3/4] bg-gray-50">
                      {rp.thumbnail ? (
                        <img
                          src={rp.thumbnail}
                          alt={rp.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-200">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                      )}
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:text-red-500 transition text-gray-400"
                      >
                        <Heart className="h-3.5 w-3.5" />
                      </button>
                      {rpDiscount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          -{rpDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      {rp.brand && <p className="text-[11px] text-gray-400">{rp.brand.name}</p>}
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {rp.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-sm font-bold text-red-500">{sym}{rpPrice.toLocaleString()}</span>
                        {rpCompare && rpCompare > rpPrice && (
                          <span className="text-xs text-gray-400 line-through">{sym}{rpCompare.toLocaleString()}</span>
                        )}
                        {rpDiscount && (
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-{rpDiscount}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s <= 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                        <span className="text-[10px] text-gray-400 ml-0.5">(96)</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Benefits */}
        <div className="mt-12 py-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
          {([
            { icon: Award,      title: "Best Quality",      sub: "Assured Quality" },
            { icon: Truck,      title: "Free Shipping",     sub: "Order Over " + sym + "1,999" },
            { icon: RefreshCcw, title: "Easy Returns",      sub: "Within 7 Days" },
            { icon: Headphones, title: "Customer Support",  sub: "24/7 Support" },
          ] as const).map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center text-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Size Guide Modal */}
        {showSizeGuide && product.size_guide && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSizeGuide(false);
            }}
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <RulerIcon className="h-5 w-5 text-gray-700" />
                  <h3 className="text-base font-bold text-gray-900">
                    {product.category?.name ? `${product.category.name} Size Guide` : "Size Guide"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className="prose prose-sm max-w-none py-4 text-gray-700 leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: product.size_guide }}
              />

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ProductDetailClient;