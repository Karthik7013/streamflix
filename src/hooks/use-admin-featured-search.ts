"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export function useAdminFeaturedSearch(
  entityIdField: "movieId" | "seriesId",
  alreadyFeaturedIds: Set<number>,
  onSuccess?: () => void,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const entityLabel = entityIdField === "movieId" ? "movie" : "series";

  const { data: searchResults = [], isFetching: searching } = useQuery<SearchResult[]>({
    queryKey: [entityIdField === "movieId" ? "/api/admin/movies" : "/api/admin/series", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const params = new URLSearchParams({ search: searchQuery.trim(), limit: "10" });
      const result = entityIdField === "movieId"
        ? await adminApi.movies.search(params)
        : await adminApi.series.search(params);
      return result.data;
    },
    enabled: !!searchQuery,
    staleTime: STALE.FAST,
  });

  const addMutation = useMutation({
    mutationFn: async (id: number) => {
      if (entityIdField === "movieId") {
        await adminApi.featured.create({ movieId: id });
      } else {
        await adminApi.featuredSeries.create({ seriesId: id });
      }
    },
    onSuccess: () => {
      toast.success(`${entityIdField === "movieId" ? "Movie" : "Series"} added to featured.`);
      setSearchQuery("");
      onSuccess?.();
    },
    onError: (err) => {
      logger.error("featured", `Failed to add ${entityLabel}`, err);
      toast.error(`Unable to add ${entityLabel} to featured.`);
    },
  });

  const isDisabled = useCallback(
    (id: number) => alreadyFeaturedIds.has(id) || addMutation.isPending,
    [alreadyFeaturedIds, addMutation.isPending],
  );

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    addMutation,
    isDisabled,
  };
}
