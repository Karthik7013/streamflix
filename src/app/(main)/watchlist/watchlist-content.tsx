"use client";

import { useRef, useEffect } from "react";
import { useWatchlistToggle } from "@/hooks/use-watchlist-toggle";
import { useWatchlistList } from "@/hooks/use-watchlist-list";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { ChevronLeft } from "lucide-react";

const SKELETON_ITEMS_8 = Array.from({ length: 8 }, (_, i) => i);
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, Search, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/error-state";

export function WatchlistContent() {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const removeFavorite = useWatchlistToggle();
  const { movies, loading, isError, retry, fetchNextPage, hasNextPage, isFetchingNextPage } = useWatchlistList();

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

  if (isError) {
    return <ErrorState message="Unable to load your watchlist." onRetry={retry} />;
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-8 lg:px-12 pt-8 pb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">Movies you've saved</p>
        </div>
        <hr className="border-border/50" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {SKELETON_ITEMS_8.map((i) => (
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
          <Bookmark className="size-8 text-muted-foreground" />
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
    <div className="space-y-6 px-4 md:px-8 lg:px-12 pt-8 pb-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1">
        <ChevronLeft className="size-4" />
        Back
      </button>
      <div>
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">{movies.length} {movies.length === 1 ? "movie" : "movies"} saved</p>
      </div>
      <hr className="border-border/50" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((m) => (
          <div key={"fav-" + m.id} className="relative group">
            <MovieCard title={m.title} slug={m.slug} thumbnailUrl={m.thumbnailUrl} />
            <button
              onClick={() => removeFavorite.mutate(m.id)}
              disabled={removeFavorite.isPending}
              className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-50"
            >
              {removeFavorite.isPending ? <Loader2 className="size-4 animate-spin text-white" /> : <Bookmark className="size-4 fill-primary text-primary" />}
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
