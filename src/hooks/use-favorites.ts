"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFavoritesToggle() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, number>({
    mutationFn: async (movieId: number) => {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (movieId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { movies?: Array<{ id: number }> };
        return {
          ...data,
          movies: (data.movies ?? []).filter((m) => m.id !== movieId),
        };
      });
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: unknown) => {
      const context = ctx as { prev?: unknown } | undefined;
      if (context?.prev) {
        queryClient.setQueryData(["favorites"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
