import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Phase 10.5A — minimal unit-test runner for pure SEO-metadata logic
 * (lib/seo-metadata.ts, lib/seo-checks.ts). No jsdom/React rendering is
 * needed since these are plain data-in/data-out functions; kept
 * deliberately light rather than pulling in Testing Library / jsdom for
 * a monitoring-only phase.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
