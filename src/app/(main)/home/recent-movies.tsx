"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { HomeMovie } from "./types";

interface RecentAddData {
  recentlyAdded: HomeMovie[];
}

async function fetchRecentlyAdded(): Promise<RecentAddData> {
  const res = await fetch("/api/home/recently-added");
  if (!res.ok) throw new Error("Failed to fetch recently added");
  return res.json();
}

export default function RecentMovies() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recently-added"],
    queryFn: fetchRecentlyAdded,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <section className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
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
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <ErrorState message="Failed to load." onRetry={refetch} />
      </section>
    );
  }

  const movies = data?.recentlyAdded || [];
  if (movies.length === 0) return null;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((m: HomeMovie) => (
          <div key={"ra-" + m.id} className="shrink-0 w-48">
            <MovieCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
}
