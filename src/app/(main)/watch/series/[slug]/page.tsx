"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { StreamflixPlayer } from "@/components/streamflix-player";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeriesDetail } from "@/hooks/use-series-detail";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { formatMinutes, formatYear } from "@/lib/format";
import { episodeThumbnail } from "@/lib/player-utils";

export default function WatchSeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const seasonParam = parseInt(searchParams.get("season") || "1");
  const episodeParam = parseInt(searchParams.get("episode") || "1");

  const { data: series, loading } = useSeriesDetail(slug);

  const currentEpisode = series?.seasons
    .find((s) => s.seasonNumber === seasonParam)
    ?.episodes.find((e) => e.episodeNumber === episodeParam);

  const allEpisodes = series?.seasons.flatMap((s) => s.episodes) ?? [];
  const currentIndex = currentEpisode
    ? allEpisodes.findIndex((e) => e.id === currentEpisode.id)
    : -1;
  const nextEpisode = currentIndex >= 0 && currentIndex < allEpisodes.length - 1
    ? allEpisodes[currentIndex + 1]
    : null;

  function getNextEpisodeUrl(): string | undefined {
    if (!nextEpisode) return undefined;
    const season = series?.seasons.find((s) =>
      s.episodes.some((e) => e.id === nextEpisode.id)
    );
    if (!season) return undefined;
    return `/watch/series/${slug}?season=${season.seasonNumber}&episode=${nextEpisode.episodeNumber}`;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-60 bg-black flex items-center justify-center">
        <Skeleton className="size-16 rounded-full" />
      </div>
    );
  }

  if (!series || !currentEpisode || !currentEpisode.videoUrl) {
    return (
      <div className="fixed inset-0 z-60 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {!series
              ? "Series not found."
              : !currentEpisode
                ? "Episode not found."
                : "This episode isn't available yet."}
          </p>
          <Link
            href={`/series/${slug}`}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-transparent px-4 h-9 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Back to series
          </Link>
        </div>
      </div>
    );
  }

  const episodeTitle = `S${seasonParam}:E${episodeParam} - ${currentEpisode.title}`;

  return (
    <StreamflixPlayer
      src={currentEpisode.videoUrl}
      poster={episodeThumbnail(currentEpisode) || currentEpisode.backdropUrl || series.thumbnailUrl}
      title={episodeTitle}
      metadata={{
        year: formatYear(series.releaseDate) ?? undefined,
        duration: formatMinutes(currentEpisode.durationSeconds)?.toString() ?? undefined,
        synopsis: currentEpisode.description || undefined,
      }}
      onBack={() => window.history.back()}
      nextEpisode={nextEpisode ? {
        title: nextEpisode.title,
        thumbnail: episodeThumbnail(nextEpisode) || undefined,
        onPlay: () => {
          const url = getNextEpisodeUrl();
          if (url) router.push(url);
        },
      } : undefined}
      episodeSelector={
        series.seasons.map((s) => ({
          seasonNumber: s.seasonNumber,
          episodes: s.episodes.map((e) => ({
            episodeNumber: e.episodeNumber,
            title: e.title,
            slug: e.slug,
            isActive: e.id === currentEpisode.id,
            href: `/watch/series/${slug}?season=${s.seasonNumber}&episode=${e.episodeNumber}`,
          })),
        }))
      }
    />
  );
}
