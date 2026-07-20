"use client";
import Link from "next/link";

interface Props {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  thumbnail?: string | null;
}

export function ProductCardSmall({ name, slug, price, compare_price, thumbnail }: Props) {
  return (
    <Link href={`/products/${slug}`}
      className="group block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition duration-300">
      <div className="aspect-square overflow-hidden bg-gray-50">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>
      <div className="px-2 py-2">
        <p className="text-[11px] text-gray-600 line-clamp-1 leading-tight">{name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-black text-gray-900">৳ {price.toLocaleString()}</span>
          {compare_price && (
            <span className="text-[10px] text-gray-300 line-through">৳ {compare_price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
