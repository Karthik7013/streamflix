"use client";

import { useEffect, useRef } from "react";

function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    const style = getComputedStyle(el);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  root,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  root?: HTMLElement | null;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!containerRef.current) {
      containerRef.current = root ?? findScrollContainer(document.querySelector("main"));
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { root: containerRef.current, rootMargin: "0px 0px 1000px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, root]);

  return sentinelRef;
}