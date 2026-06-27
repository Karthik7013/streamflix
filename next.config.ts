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
        hostname: "media-cache.cinematerial.com",
      },
      {
        protocol: "https",
        hostname: "s3.us.archive.org",
      },
      {
        protocol: "http",
        hostname: "*.s3dns.us.archive.org",
      },
      {
        protocol: "https",
        hostname: "cdn.cinematerial.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "commondatastorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
