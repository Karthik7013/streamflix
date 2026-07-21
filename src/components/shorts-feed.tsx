"use client";

import { memo, useRef, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/error-state";
import { useShorts } from "@/hooks/use-shorts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useNavContext } from "@/lib/nav-context";

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
    if (isActive && !loaded) {
      const timer = setTimeout(() => setLoaded(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, loaded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isActive && loaded) {
      setIsBuffering(true);
      video.currentTime = 0;
      video.play().catch((err) => console.log("shorts: play blocked", short.id, err));
    } else {
      video.pause();
      setIsBuffering(false);
    }
  }, [isActive, loaded, hasError]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={loaded ? `/api/video?url=${encodeURIComponent(short.mp4Url)}` : undefined}
        poster={short.posterUrl || undefined}
        muted
        playsInline
        loop
        preload="none"
        onError={() => setHasError(true)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        className={`h-full w-full pointer-events-none ${hasError ? "hidden" : "object-cover"}`}
      />
      {isActive && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <Loader2 className="size-8 animate-spin text-white" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-6 left-4 right-4 z-20 pointer-events-none">
        <h2 className="text-white text-xl font-bold line-clamp-2" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{short.title}</h2>
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
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useShorts();

  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const { setHidden } = useNavContext();

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      setActiveIndex(index);
      setHidden(true);
    };
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi, setHidden]);

  useEffect(() => {
    if (activeIndex < items.length - 2 || !hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [activeIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prev = main.style.overflow;
    main.style.overflow = "hidden";
    return () => { main.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); carouselApi.scrollNext(); }
      if (e.key === "ArrowUp") { e.preventDefault(); carouselApi.scrollPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [carouselApi]);

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
    <div className="w-full h-full flex justify-center" onClick={() => setHidden(false)}>
      <Carousel
        opts={{ align: "start", startIndex: 0 }}
        orientation="vertical"
        setApi={setCarouselApi}
        className="h-full w-full max-w-md"
      >
        <CarouselContent className="-mt-0 h-full">
          {items.map((short, i) => (
            <CarouselItem key={short.id} className="h-dvh basis-full pt-0">
              <div className="relative h-full w-full">
                <ShortCard short={short} isActive={i === activeIndex} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
