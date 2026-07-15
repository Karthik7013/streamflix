"use client";

import { memo, useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { STALE } from "@/lib/stale-times";
import { shortsApi } from "@/lib/api/shorts";

const LIMIT = 10;

interface CardShort {
  id: number;
  title: string;
  mp4Url: string;
  posterUrl: string | null;
}

const ShortCard = memo(function ShortCard({ short, isActive }: { short: CardShort; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isActive && !loaded) setLoaded(true);
  }, [isActive, loaded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isActive) {
      setIsBuffering(true);
      video.currentTime = 0;
      const tryPlay = () => video.play().catch((err) => console.log("shorts: play blocked", short.id, err));
      if (video.readyState >= 2) {
        tryPlay();
      } else {
        video.addEventListener("canplay", tryPlay, { once: true });
      }
      return () => video.removeEventListener("canplay", tryPlay);
    } else {
      video.pause();
      setIsBuffering(false);
    }
  }, [isActive, hasError]);

  return (
    <div className="absolute inset-x-0 h-dvh bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={loaded ? `/api/video?url=${encodeURIComponent(short.mp4Url)}` : undefined}
        poster={short.posterUrl || undefined}
        muted
        playsInline
        loop
        preload="auto"
        onError={() => setHasError(true)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        className={`h-full w-full ${hasError ? "hidden" : "object-contain"}`}
      />
      {isActive && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <Loader2 className="size-8 animate-spin text-white" />
        </div>
      )}
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      )}
      <div className="absolute bottom-6 left-4 right-4">
        <h2 className="text-white text-lg font-bold drop-shadow-md line-clamp-2">{short.title}</h2>
      </div>
      {hasError && (
        <div className="absolute top-4 left-4 rounded-full bg-red-600/70 px-3 py-1 text-xs text-white backdrop-blur-sm">
          Video unavailable
        </div>
      )}
    </div>
  );
});

export function ShortsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["shorts"],
    queryFn: ({ pageParam }) => shortsApi.list({ cursor: pageParam, limit: LIMIT }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as number | undefined,
    staleTime: STALE.DEFAULT,
  });

  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isFetchingRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prev = main.style.scrollSnapType;
    main.style.scrollSnapType = "y proximity";
    return () => { main.style.scrollSnapType = prev; };
  }, []);

  const observerRef = useRef<IntersectionObserver>(
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-short-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.5 },
    )
  );

  useEffect(() => {
    const obs = observerRef.current;
    return () => obs.disconnect();
  }, []);

  const observeCard = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    observerRef.current.observe(el);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const sentinelObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    sentinelObserver.observe(sentinel);
    return () => sentinelObserver.disconnect();
  }, [hasNextPage, fetchNextPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const next = e.key === "ArrowDown"
        ? Math.min(activeIndex + 1, items.length - 1)
        : Math.max(activeIndex - 1, 0);
      if (next !== activeIndex) {
        document.querySelector(`[data-short-index="${next}"]`)?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, items.length]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="size-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <ErrorState message="Unable to load shorts." onRetry={refetch} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <p className="text-white/50 text-sm">No shorts available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {items.map((short, i) => (
        <div key={short.id} ref={observeCard} data-short-index={i} className="snap-start shrink-0 h-dvh w-full relative">
          <ShortCard short={short} isActive={i === activeIndex} />
        </div>
      ))}
      {hasNextPage && (
        <div ref={sentinelRef} className="h-dvh w-full flex items-center justify-center bg-black">
          <Loader2 className="size-8 animate-spin text-white/50" />
        </div>
      )}
    </div>
  );
}
