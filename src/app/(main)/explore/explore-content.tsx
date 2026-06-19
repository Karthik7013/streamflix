"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
    refetchOnMount: false,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["movies", debouncedSearch, selectedTags],
    queryFn: ({ pageParam }) => {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set("q", debouncedSearch);
      if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
      if (pageParam) p.set("cursor", String(pageParam));
      return fetchMovies(p.toString());
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
    refetchOnMount: false,
  });

  const movies = data?.pages.flatMap((p) => p.movies) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const loading = isLoading || isFetchingNextPage;
  const error = isError && !isFetchingNextPage && movies.length === 0;

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
