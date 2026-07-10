"use client";

import { useRef, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFavoritesToggle } from "@/hooks/use-favorites";
import { favoritesApi } from "@/lib/api/favorites";
import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Search, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/error-state";

const LIMIT = 20;

export function FavoritesContent() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const removeFavorite = useFavoritesToggle();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["favorites"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      return favoritesApi.list(params);
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const movies = useMemo(
    () => data?.pages.flatMap((p) => p.movies) ?? [],
    [data?.pages]
  );

  if (isError) {
    return <ErrorState message="Unable to load your watchlist." onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 md:px-8 lg:px-12">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
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

  if (movies.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Heart className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Your watchlist is empty.</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Explore our library to add your first favorite.
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
    <div className="space-y-6 px-4 md:px-8 lg:px-12 pb-8">
      <h1 className="text-2xl font-bold">My Watchlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((m) => (
          <div key={"fav-" + m.id} className="relative group">
            <MovieCard title={m.title} slug={m.slug} thumbnailUrl={m.thumbnailUrl} />
            <button
              onClick={() => removeFavorite.mutate(m.id)}
              className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <Heart className="size-4 fill-destructive text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
