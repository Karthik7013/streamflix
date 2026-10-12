import { memo } from "react";
import { ShimmerImage } from "@/components/movie/shimmer-image";
import { getTmdbNowPlaying } from "@/services/tmdb";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface WallTileProps {
  url: string;
  priority?: boolean;
  mobileStagger?: boolean;
  desktopStagger?: boolean;
}

const WallTile = memo(function WallTile({ url, priority, mobileStagger, desktopStagger }: WallTileProps) {
  return (
    <div
      className={cn(
        "relative h-[180px] overflow-hidden rounded-xl bg-white/5 md:h-[250px] md:rounded-[14px]",
        mobileStagger && "mt-[30px]",
        !desktopStagger && "md:mt-0",
        desktopStagger && "md:mt-10"
      )}
    >
      <ShimmerImage
        src={url}
        alt=""
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 768px) 30vw, 15vw"
        imgClassName="object-cover"
        wrapperClassName="absolute inset-0"
        referrerPolicy="no-referrer"
      />
    </div>
  );
});

export async function WelcomePosterWall() {
  const posters = await getTmdbNowPlaying().catch((err) => {
    logger.error("landing", "TMDB now-playing failed, rendering without wall", err);
    return [] as string[];
  });
  if (posters.length === 0) return null;

  const base = posters.slice(0, 12);
  const tiles = [...base, ...base];
  return (
    <div
      aria-hidden
      className="absolute -top-[50px] -left-4 grid w-[470px] rotate-[-8deg] grid-cols-3 gap-2.5 animate-infinite-scroll md:-top-[90px] md:-right-[60px] md:left-auto md:w-[760px] md:grid-cols-4 md:gap-3.5"
    >
      {tiles.map((url, i) => (
        <WallTile
          key={i}
          url={url}
          priority={i < 4}
          mobileStagger={i % 3 === 1}
          desktopStagger={i % 4 === 1 || i % 4 === 3}
        />
      ))}
    </div>
  );
}
