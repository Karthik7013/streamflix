"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { HeroSlide } from "@/components/movie/hero-slide";
import { EmptyCarousel, CarouselLoading } from "@/components/movie/hero-carousel-states";
import { ErrorState } from "@/components/feedback/error-state";
import type { FeaturedItem } from "@/types";

const AUTOPLAY_MS = 6000;

export const HeroCarousel = memo(function HeroCarousel({
  data,
  loading = false,
  isError = false,
  retry = () => {},
  linkPrefix = "/movies/",
}: {
  data: FeaturedItem[];
  loading?: boolean;
  isError?: boolean;
  retry?: () => void;
  linkPrefix?: string;
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % data.length);
    }, AUTOPLAY_MS);
  }, [data.length]);

  useEffect(() => {
    if (data.length <= 1) return;
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data.length, startTimer]);

  const goTo = useCallback((i: number) => {
    setCurrent(i);
    startTimer();
  }, [startTimer]);

  if (loading) return <CarouselLoading />
  if (isError) return <ErrorState message="Failed to load featured titles." onRetry={retry} />
  if (data.length === 0) return <EmptyCarousel />

  const activeIndex = Math.min(current, data.length - 1);

  return (
    <div className="relative overflow-hidden bg-muted">
        {data.map((item, i) => (
          <HeroSlide
            key={item.id}
            item={item}
            isActive={i === activeIndex}
            linkPrefix={linkPrefix}
          />
        ))}

        <div className="relative z-0 h-[60vh] md:h-[60vh] md:min-h-[460px] xl:h-[70vh]" />

        {data.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-6 md:px-10 lg:px-14 pb-4">
            <div className="flex gap-1.5 flex-1 max-w-md">
              {data.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
                >
                  <div
                    className={`absolute inset-0 bg-white rounded-full transition-all duration-300 ${i === activeIndex ? 'animate-progress' : ''
                      }`}
                    style={{
                      animationDuration: i === activeIndex ? `${AUTOPLAY_MS}ms` : undefined,
                      transform: i < activeIndex ? 'scaleX(1)' : i === activeIndex ? undefined : 'scaleX(0)',
                      opacity: i < activeIndex ? 0.4 : i === activeIndex ? 1 : 0,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
});
