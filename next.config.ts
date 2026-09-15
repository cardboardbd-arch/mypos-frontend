import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to optimise images served by the Laravel backend.
    // Add any CDN hostname here as well if the backend ever moves to one.
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Generate a full responsive srcset for every image.
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 60,
  },
  // Compress static assets.
  compress: true,

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.marvelouslifestyle.com/api";
    let apiOrigin = "https://api.marvelouslifestyle.com";
    try {
      apiOrigin = new URL(apiBase).origin;
    } catch {
      apiOrigin = "https://api.marvelouslifestyle.com";
    }

    return [
      {
        source: "/curator/:path*",
        destination: `${apiOrigin}/curator/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${apiOrigin}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
