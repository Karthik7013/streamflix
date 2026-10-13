"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client/admin";
import { queryKeys } from "@/lib/query-keys";

export const CACHE_FLUSH_SCOPES = [
  { value: "home", label: "Home" },
  { value: "movies-list", label: "Movies list" },
  { value: "movie-detail", label: "Movie detail" },
  { value: "tags", label: "Tags" },
  { value: "tag-movies", label: "Tag movies" },
  { value: "watchlist", label: "Watchlist" },
  { value: "requests", label: "Requests" },
  { value: "admin", label: "Admin" },
  { value: "comments", label: "Comments" },
  { value: "reports", label: "Reports" },
  { value: "shorts", label: "Shorts" },
  { value: "all", label: "All cache (reload spike)" },
] as const;

export function useFlushCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scope: string) => {
      const { data } = await adminApi.cache.flush(scope);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Cache cleared (${data.flushed} keys, ${data.scope}).`);
    },
    onError: () => {
      toast.error("Unable to flush cache.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
}
