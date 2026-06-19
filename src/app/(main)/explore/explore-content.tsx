"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Film } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";


async function fetchTags() {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

async function fetchMovies(params: string) {
  const res = await fetch(`/api/movies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
}

export function ExploreContent({ isAdmin }: { isAdmin?: boolean }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  type MovieCardProps = React.ComponentPropsWithoutRef<typeof MovieCard>;
  const [appendedMovies, setAppendedMovies] = useState<MovieCardProps[]>([]);
  const [appendCursor, setAppendCursor] = useState<number | null>(null);
  const [appendHasMore, setAppendHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    refetchOnMount: false,
  });

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
  const paramsStr = params.toString();

  const moviesQuery = useQuery({
    queryKey: ["movies", debouncedSearch, selectedTags],
    queryFn: () => fetchMovies(paramsStr),
    refetchOnMount: false,
  });

  const movies = [...(moviesQuery.data?.movies || []), ...appendedMovies];
  const total = moviesQuery.data?.total ?? 0;
  const queryHasMore = moviesQuery.data?.hasMore ?? false;
  const hasMore = appendHasMore || queryHasMore;
  const initialLoading = moviesQuery.isLoading;
  const loading = initialLoading || loadingMore;
  const error = !initialLoading && moviesQuery.isError && appendedMovies.length === 0;

  useEffect(() => {
    queueMicrotask(() => {
      setAppendedMovies([]);
      setAppendCursor(null);
      setAppendHasMore(false);
    });
  }, [debouncedSearch, selectedTags]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set("q", debouncedSearch);
      if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
      if (appendCursor) p.set("cursor", String(appendCursor));
      const data = await fetchMovies(p.toString());
      setAppendedMovies((prev) => [...prev, ...data.movies]);
      setAppendCursor(data.nextCursor);
      setAppendHasMore(data.hasMore);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedTags, appendCursor, hasMore, loadingMore]);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore || initialLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [appendCursor, hasMore, loadingMore, loadMore, initialLoading]);

  const toggleTag = useCallback((tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search movies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total > 0 ? `${total} movie${total === 1 ? "" : "s"} found` : ""}
        </p>
        {!isAdmin && (
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Film className="size-4" />
            Request a Movie
          </Link>
        )}
      </div>
      {tags && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag: { id: number; name: string }) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      {!loading && error && movies.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Failed to load movies. Try again.</p>
      ) : !loading && !error && movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No movies found</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Request it and we&apos;ll consider adding it.
          </p>
          {!isAdmin && (
            <Link
              href="/requests"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Film className="size-4" />
              Request a Movie
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((m: React.ComponentPropsWithoutRef<typeof MovieCard>) => (
            <MovieCard key={m.id} {...m} />
          ))}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={"skel-" + i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      )}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
