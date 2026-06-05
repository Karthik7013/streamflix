"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

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

export function ExploreContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const buildParams = useCallback(
    (c: number | null) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (c) params.set("cursor", String(c));
      return params.toString();
    },
    [debouncedSearch, selectedTags]
  );

  const loadMovies = useCallback(
    async (c: number | null, append: boolean) => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchMovies(buildParams(c));
        if (append) {
          setMovies((prev) => [...prev, ...data.movies]);
        } else {
          setMovies(data.movies);
        }
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    setMovies([]);
    setCursor(null);
    setHasMore(true);
    setError(false);
    loadMovies(null, false);
  }, [buildParams, loadMovies]);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMovies(cursor, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadMovies]);

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search movies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {tags && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag: any) => (
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((m) => (
            <MovieCard key={m.id} {...m} />
          ))}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      )}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
