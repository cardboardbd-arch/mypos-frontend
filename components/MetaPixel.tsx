"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initMetaPixel, DEFAULT_PIXEL_ID } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 1. Immediately init with env var or DEFAULT_PIXEL_ID so Meta Pixel Helper detects it instantly
    const initialId = process.env.NEXT_PUBLIC_META_PIXEL_ID || DEFAULT_PIXEL_ID;
    initMetaPixel(initialId);

    // 2. Also fetch latest configured pixel ID from backend settings if available
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    fetch(`${apiUrl}/v1/settings/analytics`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((json) => {
        const pixelId = json?.data?.meta_pixel_id;
        if (pixelId && pixelId !== initialId) {
          initMetaPixel(pixelId);
        }
      })
      .catch(() => {
        // Fallback already initialized above
      });
  }, []);

  // Track PageView on route changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
