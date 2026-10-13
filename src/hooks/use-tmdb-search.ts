"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client/admin";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/stale-times";
import { logger } from "@/lib/logger";
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
      try {
        const { results } = await adminApi.tmdb.search(submittedQuery);
        return results;
      } catch (err) {
        logger.error("tmdb", "TMDB search failed", err);
        toast.error("TMDB search failed. Please try again.");
        throw err;
      }
    },
    enabled: submittedQuery.trim().length > 0,
    staleTime: STALE.DEFAULT,
  });

  const importMutation = useMutation({
    mutationFn: async (item: TmdbSearchResult) => {
      return adminApi.tmdb.import(item.id);
    },
    onError: (err) => {
      logger.error("tmdb", "TMDB import failed", err);
      toast.error("TMDB import failed. Please try again.");
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