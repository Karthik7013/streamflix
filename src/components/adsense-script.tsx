"use client";

import Script from "next/script";

const FALLBACK_CLIENT = "ca-pub-1717161111296172";

interface AdsenseScriptProps {
  clientId?: string;
}

export function AdsenseScript({ clientId }: AdsenseScriptProps) {
  const client = clientId ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? FALLBACK_CLIENT;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
