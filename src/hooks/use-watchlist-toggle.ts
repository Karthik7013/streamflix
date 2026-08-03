"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { optimisticUpdate } from "@/lib/optimistic";
import type { PaginationMeta, MovieCardData } from "@/types";

type WatchlistPage = { data: MovieCardData[]; meta: PaginationMeta };

export function useWatchlistToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => watchlistApi.toggle(movieId),
    onMutate: async (movieId) =>
      optimisticUpdate<InfiniteData<WatchlistPage>>(
        queryClient,
        ["watchlist"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.filter((m) => m.id !== movieId),
            })),
          };
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

export function useDetailWatchlistToggle(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => watchlistApi.toggle(movieId),
    onMutate: async (_movieId) => {
      void _movieId;
      await queryClient.cancelQueries({ queryKey: ["movie", slug] });
      const prev = queryClient.getQueryData(["movie", slug]);
      if (prev) {
        queryClient.setQueryData(["movie", slug], (old: unknown) =>
          old ? { ...(old as Record<string, unknown>), isInWatchlist: !(old as Record<string, unknown>).isInWatchlist } : old
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["movie", slug], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", slug] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["home-watchlist"] });
    },
  });
}
