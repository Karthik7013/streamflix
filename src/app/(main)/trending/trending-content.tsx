"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { Flame } from "lucide-react";
import { STALE } from "@/lib/stale-times";
import { trendingApi } from "@/lib/api/trending";

export default function TrendingContent() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: () => trendingApi.list(),
    staleTime: STALE.DEFAULT,
  });

  if (isError) {
    return <ErrorState message="Unable to load trending titles." onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Trending</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const movies = data?.trending ?? [];

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Flame className="size-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Nothing trending yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Favorites are what makes titles trend. Start favoriting movies to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-8 lg:px-12 pb-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10">
          <Flame className="size-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Trending</h1>
          <p className="text-sm text-muted-foreground">Most favorited movies</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((m, i) => (
          <div key={m.id} className="relative">
            <div className="absolute -top-1 -left-1 z-10 flex size-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
              {i + 1}
            </div>
            <MovieCard title={m.title} slug={m.slug} thumbnailUrl={m.thumbnailUrl} />
          </div>
        ))}
      </div>
    </div>
  );
}
