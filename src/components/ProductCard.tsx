import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ProductCardProps = {
  /** URL of the default image */
  imageUrl: string;
  /** URL of the image shown on hover (optional) */
  hoverImageUrl?: string;
  /** Product title */
  title: string;
  /** Short description */
  description?: string;
  /** Price display */
  price?: string | number;
  /** Link to the product detail page */
  href: string;
  /** Optional callback invoked when the " Add to Cart\ button is clicked */
 onAddToCart?: () => void;
};

/**
 * Reusable product card component.
 * Shows imageUrl by default and swaps to hoverImageUrl on mouse hover.
 * Tailwind classes are used for layout and simple styling – adjust as needed.
 */
export default function ProductCard({
 imageUrl,
 hoverImageUrl,
 title,
 description,
 price,
 href,
 onAddToCart,
}: ProductCardProps) {
 const [currentSrc, setCurrentSrc] = useState(imageUrl);

 const handleMouseEnter = () => {
 if (hoverImageUrl) setCurrentSrc(hoverImageUrl);
 };

 const handleMouseLeave = () => {
 setCurrentSrc(imageUrl);
 };

 return (
 <div
 className=\group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md\
 onMouseEnter={handleMouseEnter}
 onMouseLeave={handleMouseLeave}
 >
 <Link href={href} className=\block\>
 <div className=\relative aspect-square w-full overflow-hidden rounded-md\>
 <Image
 src={currentSrc}
 alt={title}
 fill
 className=\object-cover transition-opacity duration-300\
 priority={false}
 />
 </div>
 <h3 className=\mt-2 text-sm font-medium text-gray-900 line-clamp-2\>{title}</h3>
 {description && (<p className=\mt-1 text-xs text-gray-500 line-clamp-2\>{description}</p>)}
 {price && (<p className=\mt-2 text-sm font-semibold text-gray-900\></p>)}
 </Link>
 {onAddToCart && (
 <button
 type=\button\
 className=\absolute inset-x-0 bottom-2 mx-auto hidden w-11/12 rounded bg-indigo-600 py-1 text-xs font-medium text-white hover:bg-indigo-700 group-hover:block\
 onClick={(e) => {e.stopPropagation(); e.preventDefault(); onAddToCart();}}
 >Add to Cart</button>
 )}
 </div>
 );
}
