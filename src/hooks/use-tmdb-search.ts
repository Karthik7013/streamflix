"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { generateSlug } from "@/lib/validation";

export interface TmdbImportResult {
  title: string;
  overview: string;
  releaseDate: string;
  originalLanguage: string;
  tmdbId: number;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
}

interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  original_language: string;
}

export function useTmdbSearch(mediaType: "movie" | "tv" = "movie") {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);

  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const { results } = await adminApi.tmdb.search(q, mediaType);
      return results as TmdbSearchResult[];
    },
    onSuccess: (data) => setResults(data),
  });

  const importMutation = useMutation({
    mutationFn: async (item: TmdbSearchResult) => {
      const slug = generateSlug(item.title);
      const releaseDate = item.release_date;
      const result = await adminApi.tmdb.import(item.id, slug, mediaType, releaseDate || undefined);
      return result as TmdbImportResult;
    },
  });

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    searchMutation.mutate(query.trim());
  }, [query]);

  return {
    query,
    setQuery,
    results,
    searching: searchMutation.isPending,
    handleSearch,
    importMutation,
    importing: importMutation.isPending,
  };
}
