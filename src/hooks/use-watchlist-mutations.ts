"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { watchlistApi } from "@/lib/api/watchlist";
import { queryKeys } from "@/lib/query-keys";

function invalidateWatchlistKeys(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.watchlist });
  queryClient.invalidateQueries({ queryKey: queryKeys.homeWatchlist });
  queryClient.invalidateQueries({ queryKey: queryKeys.movieAll });
  queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => watchlistApi.add(movieId),
    onSuccess: () => {
      toast.success("Added to watchlist");
    },
    onError: () => {
      toast.error("Failed to add to watchlist. Please try again.");
    },
    onSettled: () => {
      invalidateWatchlistKeys(queryClient);
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => watchlistApi.remove(movieId),
    onError: () => {
      toast.error("Failed to remove from watchlist. Please try again.");
    },
    onSuccess: () => {
      invalidateWatchlistKeys(queryClient);
    },
  });
}