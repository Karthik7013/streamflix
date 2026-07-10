"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { favoritesApi } from "@/lib/api/favorites";
import { useFavoritesToggle } from "@/hooks/use-favorites";
import { Heart } from "lucide-react";

export default function WatchlistRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-watchlist"],
    queryFn: () => favoritesApi.list(new URLSearchParams({ page: "1", limit: "10" })),
    staleTime: 5 * 60 * 1000,
  });

  const removeFavorite = useFavoritesToggle();
  const movies = data?.movies ?? [];

  if (!isLoading && movies.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-12">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="size-4 fill-primary text-primary" />
          Your Watchlist
        </h2>
        {movies.length > 0 && (
          <Link
            href="/favorites"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See All →
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden py-4 px-4 md:px-8 lg:px-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 space-y-2">
              <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden py-4 px-4 md:px-8 lg:px-12 snap-x snap-mandatory scroll-pl-4 no-scrollbar">
          {movies.map((movie) => (
            <div key={movie.id} className="w-40 shrink-0 snap-start group relative">
              <MovieCard
                title={movie.title}
                slug={movie.slug}
                thumbnailUrl={movie.thumbnailUrl}
              />
              <button
                onClick={() => removeFavorite.mutate(movie.id)}
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <Heart className="size-3.5 fill-destructive text-destructive" />
              </button>
              <p className="mt-1.5 text-xs text-muted-foreground truncate">{movie.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
