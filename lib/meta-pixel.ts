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

export function isPixelInitialized(): boolean {
  return initialized && !!currentPixelId;
}

/**
 * Initializes the Meta Pixel dynamically from backend settings.
 * If no pixelId is provided from backend admin settings, does nothing.
 */
export function initMetaPixel(pixelId?: string | null): void {
  if (typeof window === "undefined" || !pixelId || !pixelId.trim()) return;

  const cleanId = pixelId.trim();

  ensureFbqStub();

  if (currentPixelId === cleanId && initialized) return;

  currentPixelId = cleanId;
  initialized = true;

  if (typeof window.fbq === "function") {
    window.fbq("init", cleanId);
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
 * Only sends events if a Pixel ID has been dynamically configured from backend settings.
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
  } else if (!initialized) {
    // If not initialized yet, queue event in case backend settings return a pixel ID shortly
    if (eventQueue.length < 20) {
      eventQueue.push({ name, params, eventId });
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
