"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, Share2 } from "lucide-react";
import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { formatYear } from "@/lib/format";
import { useSeriesDetail } from "@/hooks/use-series-detail";
import { DetailHero } from "@/components/detail-hero";
import { TrailerDialog } from "@/components/movie-trailer-dialog";
import { SeasonList } from "@/app/(main)/series/[slug]/season-list";
import { SeriesDetailSkeleton } from "@/app/(main)/series/[slug]/series-detail-skeleton";

export function SeriesDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const [showTrailer, setShowTrailer] = useState(false);

  const { data: series, loading: isLoading, error, retry } = useSeriesDetail(slug);

  function findFirstPlayable() {
    if (!series) return null;
    for (const season of series.seasons) {
      for (const ep of season.episodes) {
        if (ep.videoUrl) return { season: season.seasonNumber, episode: ep.episodeNumber };
      }
    }
    return null;
  }

  const firstPlayable = findFirstPlayable();

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: series?.title ?? "", url: window.location.href }).catch(() => { });
    }
  }

  if (isLoading) return <SeriesDetailSkeleton />;

  if (error || !series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">This series is temporarily unavailable.</p>
          <button onClick={() => retry()} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const releaseYear = formatYear(series.releaseDate);

  return (
    <>
      <DetailHero
        backdropUrl={series.backdropUrl || series.thumbnailUrl}
        thumbnailUrl={series.thumbnailUrl}
        alt={series.title}
        trailerUrl={series.trailerUrl ?? undefined}
        onTrailerClick={series.trailerUrl ? () => setShowTrailer(true) : undefined}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {releaseYear && (
            <>
              <span className="text-white/90 font-medium">{releaseYear}</span>
              <span className="text-white/30">&bull;</span>
            </>
          )}
          <span className="text-white/90 font-medium">
            {series.seasons.length} {series.seasons.length === 1 ? "season" : "seasons"}
          </span>
          <span className="text-white/30">&bull;</span>
          {series.tags.map((tag) => (
            <span key={tag.id} className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80">
              {tag.name}
            </span>
          ))}
          <span className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80 uppercase tracking-wide">
            HD
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
          {series.title}
        </h1>

        <p className="text-sm md:text-base text-white/80 leading-relaxed line-clamp-2 max-w-2xl drop-shadow-md">
          {series.description}
        </p>

        <div className="flex items-center gap-3 pt-2">
          {firstPlayable ? (
            <Link
              href={`/watch/series/${series.slug}?season=${firstPlayable.season}&episode=${firstPlayable.episode}`}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-lg"
            >
              <Play className="size-5 fill-black" />
              Play
            </Link>
          ) : (
            <span className="flex items-center gap-2 bg-white/20 text-white/60 px-6 py-2.5 rounded font-bold text-sm cursor-not-allowed">
              <Play className="size-5 fill-white/60" />
              Unavailable
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center justify-center border-2 border-white/40 text-white rounded-full size-10 hover:border-white hover:bg-white/10 transition-all active:scale-90"
          >
            <Share2 className="size-5" />
          </button>
        </div>
      </DetailHero>

      {series.trailerUrl && (
        <TrailerDialog url={series.trailerUrl} open={showTrailer} onOpenChange={setShowTrailer} />
      )}

      <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          <SeasonList seasons={series.seasons} seriesSlug={series.slug} />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
