"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initMetaPixel, isPixelInitialized } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    // Fetch dynamic pixel ID directly from backend admin settings
    fetch(`${apiUrl}/v1/settings/analytics`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json) => {
        const pixelId = json?.data?.meta_pixel_id;
        if (pixelId && typeof pixelId === "string" && pixelId.trim()) {
          initMetaPixel(pixelId.trim());
        }
      })
      .catch(() => {
        // Non-fatal if backend is unreachable
      });
  }, []);

  // Track PageView on route changes (only if pixel has been dynamically loaded from backend)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && isPixelInitialized() && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
