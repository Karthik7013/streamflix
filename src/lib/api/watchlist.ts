import { api } from "@/lib/api/client";
import type { PaginationMeta, MovieCardData } from "@/types";

export const watchlistApi = {
  list: (params?: URLSearchParams) =>
    api<{ data: MovieCardData[]; meta: PaginationMeta }>(`/api/watchlist?${params ?? ""}`),

  add: (movieId: number) =>
    api<{ data: { isInWatchlist: boolean } }>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),

  remove: (movieId: number) =>
    api<{ data: { isInWatchlist: boolean } }>(`/api/watchlist/${movieId}`, {
      method: "DELETE",
    }),
};
