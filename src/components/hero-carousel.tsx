"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import Link from "next/link";
import { ShimmerImage } from "@/components/shimmer-image";
import { Play, Info, Film } from "lucide-react";
import { formatDuration, formatYear } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { FeaturedItem } from "@/types";

const AUTOPLAY_MS = 6000;

const EmptyCarousel = () => {
  return <div className="relative flex items-center justify-center h-[60vh] md:h-[60vh] md:min-h-[460px] xl:h-[70vh] bg-muted overflow-hidden">
    <div className="absolute inset-0 bg-linear-to-b from-muted/50 to-background" />
    <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
      <div className="flex items-center justify-center size-16 rounded-full bg-muted-foreground/10">
        <Film className="size-7 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground/70">Featured section empty</p>
        <p className="text-xs text-muted-foreground/40 max-w-xs">
          No titles have been featured yet. Check back later or add featured content from the admin panel.
        </p>
      </div>
    </div>
  </div>
}


const CarouselLoading = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-12">
        <div>
          <Skeleton className="h-[60vh] md:min-h-[460px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

const HeroSlide = memo(function HeroSlide({
  item,
  isActive,
  linkPrefix,
}: {
  item: FeaturedItem;
  isActive: boolean;
  linkPrefix: string;
}) {
  const year = formatYear(item.releaseDate);
  const duration = formatDuration(item.durationSeconds);
  const tags = item.tags.slice(0, 3);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
        }`}
    >
      <div className="relative h-[60vh] md:h-[60vh] md:min-h-[460px] xl:h-[70vh] overflow-hidden">
        {isActive && (
          <div className="absolute inset-0 transition-transform duration-8000 ease-linear scale-110">
            <ShimmerImage
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 767px) 100vw, 0vw"
              imgClassName="object-cover md:hidden object-position-[50%_30%]"
              wrapperClassName="absolute inset-0"
              referrerPolicy="no-referrer"
            />
            <ShimmerImage
              src={item.backdropUrl || item.thumbnailUrl}
              alt={item.title}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 768px) 100vw, 0vw"
              imgClassName="hidden md:block object-cover"
              wrapperClassName="absolute inset-0"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="absolute
              bottom-0 left-0 right-0 h-2/5 bg-linear-to-b from-background/0 to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 hidden md:block bg-linear-to-t from-black/60 via-black/10 to-transparent" />


        <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 md:p-10 lg:p-14">
          <div className="max-w-2xl space-y-3">
            <div
              className={`flex flex-wrap items-center gap-2 text-sm text-white/80 transition-all duration-500 ${isActive ? "opacity-100 translate-y-0 delay-0" : "opacity-0 translate-y-4"
                }`}
            >
              {year && (
                <>
                  <span className="font-semibold text-white">{year}</span>
                  {duration && (
                    <span className="text-white/40">&bull;</span>
                  )}
                </>
              )}
              {duration && (
                <span>{duration}</span>
              )}
              {tags.map((tag) => (
                <span key={tag.id} className="text-white/60 text-xs border border-white/20 px-2 py-0.5 rounded">
                  {tag.name}
                </span>
              ))}
            </div>

            <h2
              className={`text-2xl font-bold font-heading text-white drop-shadow-lg md:text-4xl lg:text-5xl leading-tight transition-all duration-500 ${isActive ? "opacity-100 translate-y-0 delay-100" : "opacity-0 translate-y-4"
                }`}
            >
              {item.title}
            </h2>

            {item.description && (
              <p
                className={`text-sm md:text-base text-white/70 leading-relaxed line-clamp-2 max-w-xl drop-shadow-md transition-all duration-500 ${isActive ? "opacity-100 translate-y-0 delay-200" : "opacity-0 translate-y-4"
                  }`}
              >
                {item.description}
              </p>
            )}

            <div
              className={`flex items-center gap-3 pt-1 transition-all duration-500 ${isActive ? "opacity-100 translate-y-0 delay-300" : "opacity-0 translate-y-4"
                }`}
            >
              <Link
                href={`/watch/${item.slug}`}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-lg"
              >
                <Play className="size-4 fill-black" />
                Play
              </Link>
              <Link
                href={`${linkPrefix}${item.slug}`}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all active:scale-95"
              >
                <Info className="size-4" />
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


export const HeroCarousel = memo(function HeroCarousel({
  data,
  loading,
  isError,
  retry,
  linkPrefix = "/movies/",
}: {
  data: FeaturedItem[],
  loading: boolean,
  isError: boolean,
  retry: () => void,
  linkPrefix?: string,
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
  if (isError) return <ErrorState message="failed to load" onRetry={retry} />
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
                      width: i < activeIndex ? '100%' : i === activeIndex ? undefined : '0%',
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