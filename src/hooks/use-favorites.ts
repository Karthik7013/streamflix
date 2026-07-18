"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api/favorites";
import { optimisticUpdate } from "@/lib/optimistic";

export function useFavoritesToggle() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, number, { previous: { movies?: Array<{ id: number }> } | undefined }>({
    mutationFn: (movieId: number) => favoritesApi.toggle(movieId),
    onMutate: async (movieId) =>
      optimisticUpdate<{ movies?: Array<{ id: number }> }>(
        queryClient,
        ["favorites"],
        (old) => {
          if (!old) return old;
          return { ...old, movies: (old.movies ?? []).filter((m) => m.id !== movieId) };
        },
      ),
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(["favorites"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
    },
  });
}
