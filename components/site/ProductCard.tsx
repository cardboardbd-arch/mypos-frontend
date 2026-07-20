"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart";

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  thumbnail?: string | null;
  product_type?: string;
  variantId?: number;
  sku?: string;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compare_price,
  thumbnail,
  variantId,
  sku,
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [toastVisible, setToastVisible] = useState(false);

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    // A product id is never a valid variant id in this system — every
    // purchasable product has at least one real ProductVariant row, and
    // stock/checkout are keyed off variant_id, not product_id. If no
    // variantId was resolved (caller didn't have one, or the product
    // genuinely has no variants yet), quick-add can't work; send the
    // shopper to the product page instead of guessing.
    if (variantId == null) {
      router.push(`/products/${slug}`);
      return;
    }
    addToCart({
      id: variantId,
      productId: id,
      variantId,
      name,
      slug,
      sku: sku ?? "",
      price,
      compare_price,
      thumbnail: thumbnail ?? undefined,
      attributes: {},
      quantity: 1,
    }, 1);
    showToast();
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    if (variantId == null) {
      router.push(`/products/${slug}`);
      return;
    }
    addToCart({
      id: variantId,
      productId: id,
      variantId,
      name,
      slug,
      sku: sku ?? "",
      price,
      compare_price,
      thumbnail: thumbnail ?? undefined,
      attributes: {},
      quantity: 1,
    }, 1);
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
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
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
          {name}
        </Link>

        <div className="flex items-center gap-2">
          {compare_price != null && compare_price > price && (
            <span className="text-[11px] text-gray-300 line-through">
              Tk {compare_price.toLocaleString()}
            </span>
          )}
          <span className="font-bold text-gray-900 text-sm">
            Tk {price.toLocaleString()}
          </span>
        </div>

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
