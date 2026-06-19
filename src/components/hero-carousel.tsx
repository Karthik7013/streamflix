"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info } from "lucide-react";

interface HeroCarouselItem {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  releaseDate?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl: string;
  backdropUrl?: string;
  tags?: { id: number; name: string }[];
}

interface HeroCarouselProps {
  items: HeroCarouselItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const length = items.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skippingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const goTo = useCallback((i: number) => {
    if (skippingRef.current) return;
    skippingRef.current = true;
    clearTimers();
    setCurrent(i);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % length);
    }, 6000);
    requestAnimationFrame(() => { skippingRef.current = false; });
  }, [length, clearTimers]);

  useEffect(() => {
    if (length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % length);
    }, 6000);
    return clearTimers;
  }, [length, clearTimers]);

  if (length === 0) return null;

  function formatDuration(seconds: number | null | undefined): string | null {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function getYear(date: string | null | undefined): string | null {
    if (!date) return null;
    return new Date(date).getFullYear().toString();
  }

  return (
    <div className="relative overflow-hidden bg-muted">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Mobile: vertical poster */}
          <div className="relative h-[60vh] md:h-[60vh] xl:h-[70vh] overflow-hidden">
            <div
              className={`absolute inset-0 transition-transform duration-8000 ease-linear ${
                i === current ? "scale-110" : "scale-100"
              }`}
            >
              {/* Poster image — visible on mobile only */}
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover md:hidden"
                referrerPolicy="no-referrer"
              />
              {/* Backdrop image — visible on md+ */}
              <Image
                src={item.backdropUrl || item.thumbnailUrl}
                alt={item.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="hidden md:block object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Mobile gradient: bottom fade */}
            <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 via-40% to-transparent md:bg-linear-to-r md:from-black/80 md:via-black/30 md:to-transparent" />
            {/* Desktop extra: bottom fade for text */}
            <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 md:p-10 lg:p-14">
              <div className="max-w-2xl space-y-3">
                <div
                  className={`flex flex-wrap items-center gap-2 text-sm text-white/80 transition-all duration-500 ${
                    i === current ? "opacity-100 translate-y-0 delay-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  {getYear(item.releaseDate) && (
                    <span className="font-semibold text-white">{getYear(item.releaseDate)}</span>
                  )}
                  {formatDuration(item.durationSeconds) && (
                    <>
                      <span className="text-white/40">&bull;</span>
                      <span>{formatDuration(item.durationSeconds)}</span>
                    </>
                  )}
                  {item.tags?.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="text-white/60 text-xs border border-white/20 px-2 py-0.5 rounded">
                      {tag.name}
                    </span>
                  ))}
                </div>

                <h2
                  className={`text-2xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl leading-tight transition-all duration-500 ${
                    i === current ? "opacity-100 translate-y-0 delay-100" : "opacity-0 translate-y-4"
                  }`}
                >
                  {item.title}
                </h2>

                {item.description && (
                  <p
                    className={`text-sm md:text-base text-white/70 leading-relaxed line-clamp-2 max-w-xl drop-shadow-md transition-all duration-500 ${
                      i === current ? "opacity-100 translate-y-0 delay-200" : "opacity-0 translate-y-4"
                    }`}
                  >
                    {item.description}
                  </p>
                )}

                <div
                  className={`flex items-center gap-3 pt-1 transition-all duration-500 ${
                    i === current ? "opacity-100 translate-y-0 delay-300" : "opacity-0 translate-y-4"
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
                    href={`/movies/${item.slug}`}
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
      ))}

      <div className="relative z-0 h-[60vh] md:h-[60vh] xl:h-[70vh]" />

      {length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-6 md:px-10 lg:px-14 pb-4">
          <div className="flex gap-1.5 flex-1 max-w-md">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
              >
                <div
                  className={`absolute inset-0 bg-white rounded-full ${i === current ? 'animate-progress' : ''}`}
                  style={i === current ? { animationDuration: '6s' } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
