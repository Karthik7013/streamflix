"use client";

import { useState } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Play, Heart, Share2, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatMinutes, formatYear } from "@/lib/format";
import { RelatedMovies } from "./related-movies";
import { ReportSection } from "@/components/report-section";
import { CommentsSection } from "@/components/comments-section";

interface MovieData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
}

export function MovieDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: movie, isLoading, error, refetch } = useQuery({
    queryKey: ["movie", slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${slug}`);
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("fetch-failed");
      return res.json() as Promise<{ durationSeconds: number, releaseDate: string, isFavorited: boolean, trailerUrl: string | null, videoUrl: string | null, id: string, title: string, backdropUrl: string, thumbnailUrl: string, tags: [], description: string }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: relatedMovies } = useQuery({
    queryKey: ["related-movies", slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${slug}/related`);
      if (!res.ok) throw new Error("fetch-failed");
      const json = await res.json();
      return json.related as { id: number; title: string; slug: string; thumbnailUrl: string }[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!movie) throw new Error("No movie data");
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie.id }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
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

  if (isLoading && !movie) {
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
    if (error.message === "not-found") {
      notFound();
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Failed to load movie.</p>
          <button onClick={() => refetch()} className="text-primary hover:underline">
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
          <Image
            src={display.backdropUrl || display.thumbnailUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-position-[50%_25%]"
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
              <Image
                src={display.thumbnailUrl}
                alt={display.title}
                fill
                className="object-cover"
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
    </div>
  );
}
