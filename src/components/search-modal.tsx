"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { STALE } from "@/lib/stale-times";
import { Search, X, AlertCircle } from "lucide-react";
import { MovieCard } from "@/components/movie-card";

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search-movies", debouncedQuery],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (debouncedQuery) p.set("q", debouncedQuery);
      p.set("limit", "24");
      const res = await fetch(`/api/movies?${p.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: isOpen && debouncedQuery.length > 0,
    staleTime: STALE.DEFAULT,
  });

  const movies = data?.data ?? [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl mt-24 px-4">
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <input
            key={isOpen ? "open" : "closed"}
            ref={inputRef}
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-12 text-lg text-foreground placeholder:text-muted-foreground/60 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {!debouncedQuery ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Type to search movies...
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Search failed. Try again.</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {movies.map((m: { id: number; title: string; slug: string; thumbnailUrl: string }) => (
              <MovieCard key={m.id} {...m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
