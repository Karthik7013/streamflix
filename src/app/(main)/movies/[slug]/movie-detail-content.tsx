"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Play, Heart, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieDetailContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${params.slug}`);
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("fetch-failed");
      return res.json();
    },
    retry: false,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie.id }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["movie", params.slug] });
      const prev = queryClient.getQueryData(["movie", params.slug]);
      queryClient.setQueryData(["movie", params.slug], (old: any) =>
        old ? { ...old, isFavorited: !old.isFavorited } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["movie", params.slug], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", params.slug] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-[65vh] w-full rounded-none" />
        <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
          <div className="max-w-4xl mx-auto space-y-4 pb-16">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Failed to load movie.</p>
      </div>
    );
  }

  const durationMin = movie.durationSeconds
    ? Math.round(movie.durationSeconds / 60)
    : null;

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* ─────────── Hero Section ─────────── */}
      <div className="relative h-[65vh] min-h-[500px] w-full overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-muted">
          <Image
            src={movie.thumbnailUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Gradient overlays — Netflix-style */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>

        {/* Back button */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-6" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Info overlay — pushed to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
          <div className="max-w-3xl space-y-4">
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {releaseYear && (
                <>
                  <span className="text-white/90 font-medium">
                    {releaseYear}
                  </span>
                  <span className="text-white/30">&bull;</span>
                </>
              )}
              {durationMin && (
                <>
                  <span className="text-white/90 font-medium">
                    {durationMin} min
                  </span>
                  <span className="text-white/30">&bull;</span>
                </>
              )}
              <span className="border border-white/20 px-2 py-0.5 rounded text-xs text-white/80 uppercase tracking-wide">
                HD
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              {movie.title}
            </h1>

            {/* Description — clamped */}
            <p className="text-sm md:text-base text-white/80 leading-relaxed line-clamp-2 md:line-clamp-3 max-w-2xl drop-shadow-md">
              {movie.description}
            </p>

            {/* Action buttons — Netflix-style */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => router.push(`/watch/${params.slug}`)}
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
                  className={`size-5 ${
                    movie.isFavorited
                      ? "fill-destructive text-destructive"
                      : "text-white"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── Below the Fold ─────────── */}
      <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          {/* Full description */}
          <p className="text-foreground/80 leading-relaxed text-base md:text-lg">
            {movie.description}
          </p>
        </div>
      </div>
    </div>
  );
}
