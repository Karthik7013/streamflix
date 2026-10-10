"use client";

import { useEffect, useRef } from "react";

interface AdsenseSlotProps {
  slot?: string;
  clientId?: string;
  layoutKey?: string;
}

export function AdsenseSlot({ slot, clientId, layoutKey }: AdsenseSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  const client = clientId ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adSlot = slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOVIE;

  useEffect(() => {
    pushedRef.current = false;
    const container = containerRef.current;
    if (!container) return;

    function push() {
      if (pushedRef.current) return;
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        pushedRef.current = false;
      }
    }

    if (typeof IntersectionObserver === "undefined") {
      push();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          push();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [layoutKey]);

  if (!client || !adSlot) return null;

  return (
    <div ref={containerRef} className="min-h-[280px] w-full overflow-hidden">
      <ins
        key={layoutKey}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
