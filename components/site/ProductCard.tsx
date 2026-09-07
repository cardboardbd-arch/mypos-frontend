"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart";
import { ColorSelector } from "@/components/site/ColorSelector";
import type { ProductCardColorOption } from "@/lib/types/product";

interface ProductCardProps {
  title: string;
  /**
   * One entry = "individual" mode (the current color IS the card) or a
   * single legacy/non-fashion item. Multiple entries = "grouped" mode —
   * a color selector appears and switches the displayed color IN PLACE
   * (no navigation — every color's data is already here, unlike the PDP
   * where color switching is cross-page because each slug only carries
   * one color).
   */
  colors: ProductCardColorOption[];
}

export function ProductCard({ title, colors }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const current = colors[selectedIndex] ?? colors[0];
  if (!current) return null;

  const {
    productId,
    slug,
    color,
    thumbnail,
    hoverImage,
    price,
    comparePrice,
    discountPercentage,
    variantId,
    sku,
  } = current;

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (variantId == null) {
      router.push(`/products/${slug}`);
      return;
    }
    addToCart(
      {
        id: variantId,
        productId,
        variantId,
        name: title,
        slug,
        sku: sku ?? "",
        price,
        compare_price: comparePrice ?? undefined,
        thumbnail: thumbnail ?? undefined,
        attributes: color ? { Color: color.name } : {},
        quantity: 1,
      },
      1
    );
    showToast();
  }

  async function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    if (variantId == null) {
      router.push(`/products/${slug}`);
      return;
    }
    await addToCart(
      {
        id: variantId,
        productId,
        variantId,
        name: title,
        slug,
        sku: sku ?? "",
        price,
        compare_price: comparePrice ?? undefined,
        thumbnail: thumbnail ?? undefined,
        attributes: color ? { Color: color.name } : {},
        quantity: 1,
      },
      1
    );
    router.push("/checkout");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative group border border-gray-100 flex flex-col rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
    >
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
          >
            <Check className="h-3 w-3" /> Added to cart
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        href={`/products/${slug}`}
        className="relative aspect-[4/5] overflow-hidden bg-gray-50 block"
      >
        {discountPercentage != null && discountPercentage > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discountPercentage}% OFF
          </span>
        )}

        {thumbnail ? (
          <>
            {/* Main image — next/image gives auto WebP + srcset */}
            <Image
              src={thumbnail}
              alt={color ? `${title} — ${color.name}` : title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
              className={`object-cover transition-all duration-500 ${
                hoverImage
                  ? "group-hover:opacity-0 group-hover:scale-105"
                  : "group-hover:scale-105"
              }`}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={color ? `${title} — ${color.name} (Alternate view)` : title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                loading="lazy"
                className="absolute inset-0 object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <ShoppingCart className="h-10 w-10 text-gray-300" />
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col items-center text-center gap-2">
        <Link
          href={`/products/${slug}`}
          className="text-xs text-gray-600 line-clamp-2 leading-tight hover:text-black transition"
        >
          {title}
        </Link>

        <div className="flex items-center gap-2">
          {comparePrice != null && comparePrice > price && (
            <span className="text-[11px] text-gray-300 line-through">
              Tk {comparePrice.toLocaleString()}
            </span>
          )}
          <span className="font-bold text-gray-900 text-sm">
            Tk {price.toLocaleString()}
          </span>
        </div>

        {colors.length > 1 && (
          <ColorSelector
            colors={colors.map((c) => c.color!).filter(Boolean)}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        )}

        <div className="flex w-full gap-1 mt-1">
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-[#1a202c] hover:bg-black text-white py-2 text-[10px] font-bold uppercase tracking-wider transition rounded-sm text-center"
          >
            Buy Now
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 border border-gray-200 text-[#1a202c] py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 transition rounded-sm"
          >
            Add Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ProductCard;
