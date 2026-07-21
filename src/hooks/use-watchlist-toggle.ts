"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { optimisticUpdate } from "@/lib/optimistic";

export function useWatchlistToggle() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, number, { previous: { movies?: Array<{ id: number }> } | undefined }>({
    mutationFn: (movieId: number) => watchlistApi.toggle(movieId),
    onMutate: async (movieId) =>
      optimisticUpdate<{ movies?: Array<{ id: number }> }>(
        queryClient,
        ["watchlist"],
        (old) => {
          if (!old) return old;
          return { ...old, movies: (old.movies ?? []).filter((m) => m.id !== movieId) };
        },
      ),
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(["watchlist"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
    },
  });
}
