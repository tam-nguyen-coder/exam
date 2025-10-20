import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export config for Vercel deployment
  images: {
    unoptimized: true
  }
};

export default nextConfig;
