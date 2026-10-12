"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AdsenseSlotProps {
  slot?: string;
  clientId?: string;
  layoutKey?: string;
}

export function AdsenseSlot({ slot, clientId, layoutKey }: AdsenseSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settled, setSettled] = useState(false);

  const client = clientId ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const adSlot = slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOVIE;

  useEffect(() => {
    pushedRef.current = false;
    setCollapsed(false);
    setSettled(false);
    const container = containerRef.current;
    if (!container) return;

    const ins = container.querySelector("ins.adsbygoogle");
    if (!ins) return;
    const ad: Element = ins;

    let statusObserver: MutationObserver | null = null;
    const fallbackTimers: ReturnType<typeof setTimeout>[] = [];

    function snapshot(): "filled" | "unfilled" | "unknown" {
      if (ad.querySelector("iframe") || ad.getAttribute("data-ad-status") === "filled") return "filled";
      if (ad.getAttribute("data-ad-status") === "unfilled") return "unfilled";
      const scriptBlocked =
        !document.querySelector('script[src*="googlesyndication"]') &&
        typeof (window as unknown as Record<string, unknown>).adsbygoogle === "undefined";
      if (scriptBlocked) return "unfilled";
      return "unknown";
    }

    function settle(): boolean {
      const state = snapshot();
      if (state === "filled") {
        setSettled(true);
        return true;
      }
      if (state === "unfilled") {
        setCollapsed(true);
        return true;
      }
      return false;
    }

    function watchFill() {
      if (settle()) return;
      if (typeof MutationObserver !== "undefined") {
        statusObserver = new MutationObserver(() => {
          if (settle()) statusObserver?.disconnect();
        });
        statusObserver.observe(ad, { attributes: true, childList: true, subtree: true });
      }
      fallbackTimers.push(
        setTimeout(() => {
          if (settle()) return;
          fallbackTimers.push(
            setTimeout(() => {
              if (!settle()) setCollapsed(true);
            }, 3000)
          );
        }, 1000)
      );
    }

    function push() {
      if (pushedRef.current) return;
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        pushedRef.current = false;
      }
      watchFill();
    }

    if (typeof IntersectionObserver === "undefined") {
      push();
    } else {
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
      return () => {
        observer.disconnect();
        statusObserver?.disconnect();
        fallbackTimers.forEach(clearTimeout);
      };
    }

    return () => {
      statusObserver?.disconnect();
      fallbackTimers.forEach(clearTimeout);
    };
  }, [layoutKey]);

  if (!client || !adSlot || collapsed) return null;

  return (
    <div ref={containerRef} className={cn("w-full overflow-hidden", !settled && "min-h-[280px]")}>
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
