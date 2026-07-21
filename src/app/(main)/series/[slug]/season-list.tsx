"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, PlayIcon } from "lucide-react";
import { ShimmerImage } from "@/components/shimmer-image";
import { formatDuration } from "@/lib/format";
import { episodeThumbnail } from "@/lib/player-utils";
import type { SeriesDetail } from "@/types";

interface SeasonListProps {
  seasons: SeriesDetail["seasons"];
  seriesSlug: string;
}

export function SeasonList({ seasons, seriesSlug }: SeasonListProps) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  if (seasons.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No seasons yet.</p>;
  }

  return (
    <div className="space-y-3">
      {seasons.map((season) => (
        <div key={season.id} className="border border-border/50 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSeason === season.id ? (
                <ChevronDown className="size-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-5 text-muted-foreground" />
              )}
              <span className="font-semibold">Season {season.seasonNumber}</span>
              {season.title && (
                <span className="text-muted-foreground">— {season.title}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {season.episodes.length} {season.episodes.length === 1 ? "episode" : "episodes"}
            </span>
          </button>

          {expandedSeason === season.id && (
            <div className="border-t border-border/50 divide-y divide-border/50">
              {season.episodes.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No episodes yet.</p>
              ) : (
                season.episodes.map((ep) => (
                  <div key={ep.id} className="flex items-center gap-4 p-3 hover:bg-muted/20 transition-colors">
                    <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-muted shrink-0">
                      <EpisodeThumbnail episode={ep} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {ep.episodeNumber}.
                        </span>
                        <p className="text-sm font-semibold truncate">{ep.title}</p>
                      </div>
                      {ep.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {ep.description}
                        </p>
                      )}
                      {ep.durationSeconds && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDuration(ep.durationSeconds)}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/watch/series/${seriesSlug}?season=${season.seasonNumber}&episode=${ep.episodeNumber}`}
                      className={`inline-flex items-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors h-8 px-3 ${
                        ep.videoUrl
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-input bg-transparent text-muted-foreground pointer-events-none opacity-50"
                      }`}
                    >
                      {ep.videoUrl ? <PlayIcon className="size-3.5" /> : null}
                      {ep.videoUrl ? "Play" : "Unavailable"}
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const EpisodeThumbnail = memo(function EpisodeThumbnail({ episode }: { episode: { thumbnailUrl: string | null; tmdbStillPath: string | null } }) {
  const src = episodeThumbnail(episode);
  if (!src) return null;
  return (
    <ShimmerImage
      src={src}
      alt=""
      fill
      imgClassName="object-cover"
      wrapperClassName="absolute inset-0"
      sizes="112px"
    />
  );
});
