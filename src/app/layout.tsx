import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/layout/providers";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Toaster } from "@/components/layout/toaster";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { CookieConsent } from "@/components/layout/cookie-consent"
import { siteUrl } from "@/lib/site-url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#040906",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Streamflix Studio",
    template: "%s | Streamflix Studio",
  },
  description: "Streamflix Studio — browse movies, build watchlists, and stream trailers with a fast, ad-free interface.",
  manifest: "/manifest.json",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Streamflix Studio",
    description: "Streamflix Studio — browse movies, build watchlists, and stream trailers with a fast, ad-free interface.",
    siteName: "Streamflix Studio",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Streamflix Studio",
    description: "Streamflix Studio — browse movies, build watchlists, and stream trailers with a fast, ad-free interface.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://media-cache.cinematerial.com" />
        <link rel="preconnect" href="https://cdn.cinematerial.com" />
        <link rel="preconnect" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <NavigationProgress />
          {children}
          <Toaster />
        </Providers>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}