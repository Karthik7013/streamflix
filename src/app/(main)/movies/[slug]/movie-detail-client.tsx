"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShimmerImage } from "@/components/shimmer-image";
import { Play, Heart, Share2, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatMinutes, formatYear } from "@/lib/format";
import { useMovieDetail } from "@/hooks/use-movie-detail";
import { moviesApi } from "@/lib/api/movies";
import { STALE } from "@/lib/stale-times";
import { favoritesApi } from "@/lib/api/favorites";
import { ApiError } from "@/lib/api/client";
import type { Movie } from "@/types";
import { RelatedMovies } from "@/app/(main)/movies/[slug]/related-movies";
import { ReportSection } from "@/components/report-section";
import { CommentsSection } from "@/components/comments-section";
import { SiteFooter } from "@/components/site-footer";
import { MovieNotFound } from "@/components/movie-not-found";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", te: "Telugu", hi: "Hindi", ja: "Japanese",
  ko: "Korean", zh: "Chinese", fr: "French", de: "German",
  es: "Spanish", pt: "Portuguese", ru: "Russian", it: "Italian",
  ta: "Tamil", kn: "Kannada", ml: "Malayalam", bn: "Bengali",
  mr: "Marathi", pa: "Punjabi", gu: "Gujarati", ur: "Urdu",
  ar: "Arabic", tr: "Turkish", vi: "Vietnamese", th: "Thai",
  nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish",
  fi: "Finnish", no: "Norwegian", cs: "Czech", el: "Greek",
  ro: "Romanian", hu: "Hungarian", uk: "Ukrainian", he: "Hebrew",
  id: "Indonesian", ms: "Malay", tl: "Filipino",
};

export function MovieDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { movie: movieRaw, loading, error, retry } = useMovieDetail(slug);
  const movie = movieRaw as (Movie & { isFavorited: boolean }) | undefined;

  const { data: relatedMovies } = useQuery({
    queryKey: ["related-movies", slug],
    queryFn: async () => {
      const { data } = await moviesApi.getRelated(slug);
      return data as unknown as { id: number; title: string; slug: string; thumbnailUrl: string }[];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!movie) throw new Error("No movie data");
      return favoritesApi.toggle(movie.id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["movie", slug] });
      const prev = queryClient.getQueryData(["movie", slug]);
      queryClient.setQueryData(["movie", slug], (old: unknown) =>
        old ? { ...(old as Record<string, unknown>), isFavorited: !(old as Record<string, unknown>).isFavorited } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["movie", slug], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", slug] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const [showTrailer, setShowTrailer] = useState(false);

  if (loading && !movie) {
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
                <Skeleton className="h-4 w-1" />
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
        <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
          <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-2/3 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (error instanceof ApiError && error.code === "not-found") {
      return <MovieNotFound />;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">This title is temporarily unavailable.</p>
          <button onClick={() => retry()} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const display = movie;
  const durationMin = formatMinutes(display.durationSeconds);
  const releaseYear = formatYear(display.releaseDate);
  const isFavorited = movie?.isFavorited ?? false;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: display.title, url: window.location.href }).catch(() => { });
    }
  }

  function handleDownload() {
    if (!display.videoUrl) return;
    const a = document.createElement("a");
    a.href = display.videoUrl;
    a.download = `${display.title}.mp4`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[85vh] min-h-125 w-full overflow-hidden mb-16">
        <div className="absolute inset-0 bg-muted">
          <ShimmerImage
            src={display.backdropUrl || display.thumbnailUrl || ""}
            alt=""
            fill
            priority
            sizes="100vw"
            imgClassName="object-cover"
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
                src={display.thumbnailUrl || ""}
                alt={display.title}
                fill
                imgClassName="object-cover"
                wrapperClassName="absolute inset-0"
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
              />
              {display.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/10 shadow-lg">
                    <Play className="ml-0.5 size-6 " />
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
                {durationMin && (
                  <>
                    <span className="text-white/90 font-medium">{durationMin} min</span>
                    <span className="text-white/30">&bull;</span>
                  </>
                )}
                {display.originalLanguage && (
                  <span className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80 uppercase tracking-wide">
                    {LANGUAGE_NAMES[display.originalLanguage] || display.originalLanguage}
                  </span>
                )}
                {display.tags?.map((tag: { id: number; name: string }) => (
                  <span key={tag.id} className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80">
                    {tag.name}
                  </span>
                ))}
                <span className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80 uppercase tracking-wide">
                  HD
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                {display.title}
              </h1>

              <p className="text-sm md:text-base text-white/80 leading-relaxed line-clamp-2 max-w-2xl drop-shadow-md">
                {display.description}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => router.push(`/watch/${slug}`)}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-lg"
                >
                  <Play className="size-5 fill-black" />
                  Play
                </button>
                <button
                  onClick={() => toggleFavorite.mutate()}
                  className="flex items-center justify-center border-2 border-white/40 text-white rounded-full size-10 hover:border-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <Heart
                    className={`size-5 ${isFavorited ? "fill-destructive text-destructive" : "text-white"}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center border-2 border-white/40 text-white rounded-full size-10 hover:border-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <Share2 className="size-5" />
                </button>
                {display.videoUrl && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center border-2 border-white/40 text-white rounded-full size-10 hover:border-white hover:bg-white/10 transition-all active:scale-90"
                  >
                    <Download className="size-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {display.trailerUrl && (
        <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black">
            <div className="aspect-video">
              <iframe
                src={`${display.trailerUrl}?autoplay=1`}
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
          <RelatedMovies related={relatedMovies ?? []} />
          <div className="space-y-6 pt-4 border-t border-border">
            <ReportSection movieSlug={slug} />
            <CommentsSection movieSlug={slug} />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
