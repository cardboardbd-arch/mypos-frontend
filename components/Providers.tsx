"use client";

import { Suspense } from "react";
import { CartProvider } from "@/lib/cart";
import { MetaPixel } from "@/components/MetaPixel";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Suspense fallback={null}>
        <MetaPixel />
      </Suspense>
      {children}
    </CartProvider>
  );
}
