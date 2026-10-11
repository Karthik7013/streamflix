"use client";

import Script from "next/script";

interface AdsenseScriptProps {
  clientId?: string;
}

export function AdsenseScript({ clientId }: AdsenseScriptProps) {
  const client = clientId ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
