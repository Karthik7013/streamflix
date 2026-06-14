import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: 5 * 1024 * 1024 * 1024,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "archive.org",
        pathname: "/download/**",
      },
      {
        protocol: "https",
        hostname: "media-cache.cinematerial.com",
      },
      {
        protocol: "https",
        hostname: "cdn.cinematerial.com",
      },
    ],
  },
};

export default nextConfig;
