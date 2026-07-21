/**
 * Resolves a possibly-relative storage path (as stored raw inside a CMS
 * section's `config` JSON, e.g. "cms/sections/abc.jpg") into a fetchable
 * URL. Absolute URLs (http/https, already resolved by the backend's own
 * mediaUrl() helper) pass through untouched.
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}/storage/${path.replace(/^\/+/, "")}`;
}
