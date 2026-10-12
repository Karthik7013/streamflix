"use client";

import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { moviesApi } from "@/lib/api-client/movies";
import { ShimmerImage } from "@/components/movie/shimmer-image";

const ROWS = 12;
const COLS_MOBILE = 4;
const POSTER_LIMIT = 32;

interface BgTileProps {
  url: string | null;
  priority?: boolean;
}

const BgTile = memo(function BgTile({ url, priority }: BgTileProps) {
  if (!url) {
    return <div className="aspect-[2/3] w-full rounded-xl bg-card/50 border border-border" />;
  }
  return (
    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-border bg-card/50">
      <ShimmerImage
        src={url}
        alt=""
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 640px) 25vw, 12vw"
        imgClassName="object-cover"
        wrapperClassName="absolute inset-0"
        referrerPolicy="no-referrer"
      />
    </div>
  );
});

export function LoginBgGrid() {
  const { data } = useQuery({
    queryKey: ["login-bg-posters"],
    queryFn: async () => {
      const { data } = await moviesApi.list(new URLSearchParams({ limit: String(POSTER_LIMIT) }));
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
    refetchOnMount: false,
    retry: 1,
  });

  const posters = useMemo(() => (data ?? []).map((m) => m.thumbnailUrl), [data]);

  return (
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-[35deg] rotate-z-[20deg] skew-x-[-10deg] blur-sm">
      <div className="flex flex-col gap-8 p-4 animate-scroll-bg opacity-50">
        {Array.from({ length: ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 sm:grid-cols-8 gap-6">
            {Array.from({ length: 8 }).map((_, i) => {
              const url = posters.length > 0 ? (posters[(rowIdx * COLS_MOBILE + i) % posters.length] ?? null) : null;
              return <BgTile key={i} url={url} priority={rowIdx === 0 && i < 2} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
