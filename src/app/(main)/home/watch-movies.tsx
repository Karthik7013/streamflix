"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { HomeMovie } from "./types";

interface ContinueWatchData {
  continueWatching: HomeMovie[];
}

async function fetchContinueWatching(): Promise<ContinueWatchData> {
  const res = await fetch("/api/home/continue-watching");
  if (!res.ok) throw new Error("Failed to fetch continue watching");
  return res.json();
}

export default function WatchMovies() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["continue-watching"],
    queryFn: fetchContinueWatching,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <section className="p-4">
        <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-48 space-y-2">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="p-4">
        <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
        <ErrorState message="Failed to load." onRetry={refetch} />
      </section>
    );
  }

  const movies = data?.continueWatching || [];

  if (movies.length === 0) return null;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((m: HomeMovie) => (
          <div key={m.id} className="shrink-0 w-48">
            <MovieCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
}
