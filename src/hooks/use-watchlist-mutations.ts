"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { watchlistApi } from "@/lib/api/watchlist";

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
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
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
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
    },
  });
}