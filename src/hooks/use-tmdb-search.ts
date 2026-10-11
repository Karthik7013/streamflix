"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/stale-times";
import type { TmdbImportResult, TmdbSearchResult } from "@/types";

export type { TmdbImportResult };
export type { TmdbSearchResult };

export function useTmdbSearch() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const searchQuery = useQuery({
    queryKey: queryKeys.tmdbSearch(submittedQuery),
    queryFn: async () => {
      const { results } = await adminApi.tmdb.search(submittedQuery);
      return results;
    },
    enabled: submittedQuery.trim().length > 0,
    staleTime: STALE.DEFAULT,
  });

  const importMutation = useMutation({
    mutationFn: async (item: TmdbSearchResult) => {
      return adminApi.tmdb.import(item.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminMovies() });
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
