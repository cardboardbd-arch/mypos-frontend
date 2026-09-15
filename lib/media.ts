/**
 * Resolves a possibly-relative media path into a fetchable URL.
 * All curator and storage images are routed through the storefront origin
 * (https://marvelouslifestyle.com) via Next.js rewrites, keeping image URLs
 * branded to the main domain without exposing the api backend subdomain.
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;

  // If the path contains api.marvelouslifestyle.com, strip it to route through the storefront
  if (path.includes("api.marvelouslifestyle.com/curator/") || path.includes("api.marvelouslifestyle.com/storage/")) {
    path = path.replace(/https?:\/\/api\.marvelouslifestyle\.com/, "");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");

  // App-rooted paths (e.g. /curator/media/homepage/...)
  if (path.startsWith("/")) {
    if (siteUrl && !siteUrl.includes("localhost")) {
      return `${siteUrl}${path}`;
    }
    return path;
  }

  // If already absolute from external CDN (e.g. cloudinary, unsplash), leave intact
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Plain storage path (e.g. "products/xyz.jpg")
  const storagePath = `/storage/${path.replace(/^\/+/, "")}`;
  if (siteUrl && !siteUrl.includes("localhost")) {
    return `${siteUrl}${storagePath}`;
  }
  return storagePath;
}
