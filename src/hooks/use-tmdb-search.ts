"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/stale-times";

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

export function useTmdbSearch() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const searchQuery = useQuery({
    queryKey: queryKeys.tmdbSearch(submittedQuery),
    queryFn: async () => {
      const { results } = await adminApi.tmdb.search(submittedQuery);
      return results as TmdbSearchResult[];
    },
    enabled: submittedQuery.trim().length > 0,
    staleTime: STALE.DEFAULT,
  });

  const importMutation = useMutation({
    mutationFn: async (item: TmdbSearchResult) => {
      const result = await adminApi.tmdb.import(item.id);
      return result as TmdbImportResult;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMovies });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
  }, [query]);

  return {
    query,
    setQuery,
    results: searchQuery.data ?? [],
    searching: searchQuery.isFetching,
    handleSearch,
    importMutation,
    importing: importMutation.isPending,
  };
}
