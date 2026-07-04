"use client";

import { useQuery } from "@tanstack/react-query";
import { useFavoritesToggle } from "@/hooks/use-favorites";
import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";
import { ErrorState } from "@/components/error-state";

async function fetchFavorites() {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

import type { MovieCardData as FavoriteMovie } from "@/types";

export function FavoritesContent() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  const removeFavorite = useFavoritesToggle();

  if (isError) {
    return <ErrorState message="Failed to load favorites." onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const movies = data?.movies ?? [];

  if (movies.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Heart className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">No favorites yet</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Start exploring and add movies to your favorites to see them here.
        </p>
        <Link href="/explore">
          <Button>
            <Search className="size-4 mr-2" />
            Browse Movies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {movies.map((m: FavoriteMovie) => (
        <div key={"fav-" + m.id} className="relative group">
          <MovieCard {...m} />
          <button
            onClick={() => removeFavorite.mutate(m.id)}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <Heart className="size-4 fill-destructive text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
}
