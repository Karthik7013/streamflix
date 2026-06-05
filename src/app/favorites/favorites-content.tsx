"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchFavorites() {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export function FavoritesContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  if (isError) {
    return <p className="text-muted-foreground text-center py-12">Failed to load favorites.</p>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const movies = data?.movies ?? [];

  if (movies.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No favorites yet. Browse movies and add some!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {movies.map((m: any) => (
        <MovieCard key={m.id} {...m} />
      ))}
    </div>
  );
}
