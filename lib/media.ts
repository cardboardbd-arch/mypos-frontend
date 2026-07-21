/**
 * Resolves a possibly-relative media path into a fetchable URL. Two shapes
 * show up in the /v1/home payload:
 *
 *  - App-rooted paths (leading slash), e.g. a homepage section's own
 *    `image` field: "/mypos/public/curator/media/homepage/abc.png?w=1600...".
 *    These already include the backend's base path, so they only need the
 *    bare domain (protocol + host) prepended.
 *  - Plain storage-relative paths with no leading slash, e.g. a hero slide's
 *    "cms/sections/abc.jpg" or a category/collection/brand's raw `image`
 *    column. These resolve the same way the backend's own mediaUrl()
 *    resource helper does: {backend base}/storage/{path}.
 *
 * Absolute URLs (http/https — already resolved, or external like Unsplash)
 * pass through untouched.
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  if (path.startsWith("/")) {
    let domainRoot = "";
    try {
      domainRoot = new URL(apiBase).origin;
    } catch {
      domainRoot = apiBase.replace(/\/api\/?$/, "").replace(/\/mypos\/public$/, "");
    }
    return `${domainRoot}${path}`;
  }

  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}/storage/${path.replace(/^\/+/, "")}`;
}
