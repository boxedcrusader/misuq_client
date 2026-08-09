import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: this app has no API routes, server actions, or other
  // Next.js server features (/capture calls the backend directly from the
  // browser) — so plain static HTML/JS/CSS is sufficient. Deployable to
  // Cloudflare Pages as static assets, no Workers/adapter needed.
  output: "export",
};

export default nextConfig;
