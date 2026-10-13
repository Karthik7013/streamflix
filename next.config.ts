import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs/config";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  images: {
    // Vercel Image Optimization is quota-limited (402s once exhausted).
    // Source CDNs (TMDB sized variants, IA) serve images directly instead.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "archive.org",
      },
    ],
  },
  async headers() {
    // Content-Security-Policy in Report-Only mode: violations are logged to
    // the browser console without blocking anything. Review console output
    // across key pages (home, watch, login, AI), then flip to enforced
    // `Content-Security-Policy` and optionally add a Sentry report-uri.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://pagead2.googlesyndication.com https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src https: blob:",
      "connect-src 'self' https: wss:",
      "font-src 'self' data:",
      "frame-src https://www.youtube.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default withSentryConfig(pwa(nextConfig), {
  silent: true,
});
