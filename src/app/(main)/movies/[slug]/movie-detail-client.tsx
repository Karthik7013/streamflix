"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Bookmark, Share2, Download } from "lucide-react";
import { formatMinutes, formatYear } from "@/lib/format";
import { useMovieDetail } from "@/hooks/use-movie-detail";
import { watchlistApi } from "@/lib/api/watchlist";
import { ApiError } from "@/lib/api/client";
import type { Movie } from "@/types";
import { RelatedMovies } from "@/app/(main)/movies/[slug]/related-movies";
import { ReportSection } from "@/components/report-section";
import { CommentsSection } from "@/components/comments-section";
import { SiteFooter } from "@/components/site-footer";
import { MovieNotFound } from "@/components/movie-not-found";
import { MovieDetailSkeleton } from "@/app/(main)/movies/[slug]/movie-detail-skeleton";
import { DetailHero } from "@/components/detail-hero";
import { TrailerDialog } from "@/components/movie-trailer-dialog";

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
  const movie = movieRaw as (Movie & { isInWatchlist: boolean; related: { id: number; title: string; slug: string; thumbnailUrl: string }[] }) | undefined;
  const relatedMovies = movie?.related ?? [];

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (!movie) throw new Error("No movie data");
      const { data } = await watchlistApi.toggle(movie.id);
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["movie", slug] });
      const prev = queryClient.getQueryData(["movie", slug]);
      queryClient.setQueryData(["movie", slug], (old: unknown) =>
        old ? { ...(old as Record<string, unknown>), isInWatchlist: !(old as Record<string, unknown>).isInWatchlist } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["movie", slug], ctx.prev);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["movie", slug], (old: unknown) =>
        old ? { ...(old as Record<string, unknown>), isInWatchlist: result.isInWatchlist } : old
      );
      if (!result.isInWatchlist && movie) {
        queryClient.setQueryData(["home-watchlist"], (old: unknown) => {
          if (!old) return old;
          const typed = old as { data: { id: number }[]; meta: unknown };
          return { ...typed, data: typed.data.filter((m) => m.id !== movie.id) };
        });
        queryClient.setQueryData(["watchlist"], (old: unknown) => {
          if (!old) return old;
          const typed = old as { pages: { data: { id: number }[] }[] };
          return {
            ...typed,
            pages: typed.pages.map((p) => ({
              ...p,
              data: p.data.filter((m) => m.id !== movie.id),
            })),
          };
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
    },
  });

  const [showTrailer, setShowTrailer] = useState(false);

  if (loading && !movie) return <MovieDetailSkeleton />;

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
  const isInWatchlist = movie?.isInWatchlist ?? false;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: display.title, url: window.location.href }).catch((err) => console.error("share", err));
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
      <DetailHero
        backdropUrl={display.backdropUrl || display.thumbnailUrl || ""}
        thumbnailUrl={display.thumbnailUrl || ""}
        alt={display.title}
        trailerUrl={display.trailerUrl ?? undefined}
        onTrailerClick={display.trailerUrl ? () => setShowTrailer(true) : undefined}
      >
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
            onClick={() => toggleWatchlist.mutate()}
            className="flex items-center justify-center border-2 border-white/40 text-white rounded-full size-10 hover:border-white hover:bg-white/10 transition-all active:scale-90"
          >
            <Bookmark
              className={`size-5 ${isInWatchlist ? "fill-primary text-primary" : "text-white"}`}
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
      </DetailHero>
      {display.trailerUrl && (
        <TrailerDialog url={display.trailerUrl} open={showTrailer} onOpenChange={setShowTrailer} />
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
