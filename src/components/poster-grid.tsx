import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import { getTmdbNowPlaying } from "@/services/tmdb";
import { logger } from "@/lib/logger";

interface PosterCardProps {
  url: string;
  priority?: boolean;
}

const PosterCard = memo(function PosterCard({ url, priority }: PosterCardProps) {
  return (
    <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden border border-white/5 shadow-2xl transition-transform duration-500 bg-muted/20">
      <ShimmerImage
        src={url}
        alt=""
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 768px) 20vw, 10vw"
        imgClassName="object-cover opacity-80"
        wrapperClassName="absolute inset-0"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
});

export async function PosterGrid() {
  const posters = await getTmdbNowPlaying().catch((err) => {
    logger.error("landing", "TMDB now-playing failed, rendering without collage", err);
    return [] as string[];
  });
  if (posters.length === 0) return null;

  // Duplicate the track so the infinite-scroll loop has no gaps.
  // Static order per fetch: index keys are safe.
  const tiles = [...posters, ...posters];
  return (
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-35 rotate-z-20 skew-x-[-10deg]">
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 sm:gap-3 p-4 animate-infinite-scroll">
        {tiles.map((url, i) => (
          <PosterCard
            key={i}
            url={url}
            priority={i < 4}
          />
        ))}
      </div>
    </div>
  );
}
