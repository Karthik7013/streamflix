"use client";

import { memo } from "react";
import Link from "next/link";
import { ShimmerImage } from "@/components/movie/shimmer-image";
import { Play, Info } from "lucide-react";
import { formatDuration, formatYear } from "@/lib/format";
import type { FeaturedItem } from "@/types";

export const HeroSlide = memo(function HeroSlide({
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
