import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a plain ./out folder for GitHub Pages
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  basePath: isStatic ? "/nums" : undefined,
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
