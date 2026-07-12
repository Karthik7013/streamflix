"use client";

import { useParams } from "next/navigation";
import { ShimmerImage } from "@/components/shimmer-image";
import Link from "next/link";
import { Play, PlayIcon, ChevronDown, ChevronRight, Share2 } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BackButton } from "@/components/back-button";
import { SiteFooter } from "@/components/site-footer";
import { formatDuration, formatYear } from "@/lib/format";
import { useSeriesDetail } from "@/hooks/use-series-detail";

export function SeriesDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  const { data: series, loading: isLoading, isError, retry: refetch } = useSeriesDetail(slug);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-[40vh] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] min-h-125 w-full overflow-hidden mb-16 bg-muted">
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />
          <div className="absolute top-4 left-4 z-20">
            <Skeleton className="size-10 rounded-full" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-10 rounded" />
              </div>
              <Skeleton className="h-9 sm:h-10 md:h-14 lg:h-16 w-3/4 sm:w-2/3 md:w-3/5" />
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-3.5 md:h-4 w-full max-w-xl" />
                <Skeleton className="h-3 sm:h-3.5 md:h-4 w-4/5 max-w-lg" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-10 w-25 rounded" />
                <Skeleton className="size-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">This series is temporarily unavailable.</p>
          <button onClick={() => refetch()} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const releaseYear = formatYear(series.releaseDate);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[85vh] min-h-125 w-full overflow-hidden mb-16">
        <div className="absolute inset-0 bg-muted">
          <ShimmerImage
            src={series.backdropUrl || series.thumbnailUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            imgClassName="object-cover object-position-[50%_25%]"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />
        </div>

        <div className="absolute top-4 left-4 z-20">
          <BackButton />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
          <div className="flex gap-x-10">
            <div className="relative z-30 hidden sm:block w-28 sm:w-36 md:w-44 aspect-2/3 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              <ShimmerImage
                src={series.thumbnailUrl}
                alt={series.title}
                fill
                imgClassName="object-cover"
                wrapperClassName="absolute inset-0"
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
              />
              {series.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/10 shadow-lg">
                    <Play className="ml-0.5 size-6" />
                  </div>
                </button>
              )}
            </div>
            <div className="max-w-3xl space-y-4">
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
            </div>
          </div>
        </div>
      </div>

      {series.trailerUrl && (
        <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black">
            <div className="aspect-video">
              <iframe
                src={`${series.trailerUrl}?autoplay=1`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          <div className="space-y-3">
            {series.seasons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No seasons yet.</p>
            ) : (
              series.seasons.map((season) => (
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
                              {ep.thumbnailUrl && (
                                <ShimmerImage
                                  src={ep.thumbnailUrl}
                                  alt={ep.title}
                                  fill
                                  imgClassName="object-cover"
                                  wrapperClassName="absolute inset-0"
                                  sizes="112px"
                                />
                              )}
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
                              href={`/watch/series/${series.slug}?season=${season.seasonNumber}&episode=${ep.episodeNumber}`}
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
              ))
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
