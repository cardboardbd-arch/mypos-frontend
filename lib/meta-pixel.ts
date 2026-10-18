"use client";

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: FbqFn;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export const DEFAULT_PIXEL_ID = "1915866925691809";

let initialized = false;
let currentPixelId: string | null = null;

type QueuedEvent = {
  name: string;
  params: Record<string, unknown>;
  eventId?: string;
};

const eventQueue: QueuedEvent[] = [];

/**
 * Injects the standard Meta Pixel base snippet and stub into window.
 */
function ensureFbqStub(): void {
  if (typeof window === "undefined" || window.fbq) return;

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: FbqFn = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args);
    });
    f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
}

// Auto-inject stub immediately on client so queue is ready
if (typeof window !== "undefined") {
  ensureFbqStub();
}

/**
 * Initializes the Meta Pixel and flushes any queued events.
 */
export function initMetaPixel(pixelId: string = DEFAULT_PIXEL_ID): void {
  if (typeof window === "undefined" || !pixelId) return;

  ensureFbqStub();

  if (currentPixelId === pixelId && initialized) return;

  currentPixelId = pixelId;
  initialized = true;

  if (typeof window.fbq === "function") {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");

    // Flush any events that fired before init completed
    while (eventQueue.length > 0) {
      const ev = eventQueue.shift()!;
      if (ev.eventId) {
        window.fbq("track", ev.name, ev.params, { eventID: ev.eventId });
      } else {
        window.fbq("track", ev.name, ev.params);
      }
    }
  }
}

/**
 * Safe fbq('track', ...) wrapper.
 * If pixel is not yet initialized, events are queued and flushed upon initialization.
 */
export function trackMetaEvent(
  name: string,
  params: Record<string, unknown> = {},
  eventId?: string
): void {
  if (typeof window === "undefined") return;

  if (initialized && typeof window.fbq === "function") {
    if (eventId) {
      window.fbq("track", name, params, { eventID: eventId });
    } else {
      window.fbq("track", name, params);
    }
  } else {
    // Queue event until pixel is initialized
    eventQueue.push({ name, params, eventId });
    if (!initialized) {
      const fallbackId = process.env.NEXT_PUBLIC_META_PIXEL_ID || DEFAULT_PIXEL_ID;
      initMetaPixel(fallbackId);
    }
  }
}

/**
 * Retrieve a cookie value by name from document.cookie (used for _fbp and _fbc).
 */
export function getMetaCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}
