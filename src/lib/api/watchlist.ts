import { api } from "@/lib/api/client";
import type { PaginationMeta, MovieCardData } from "@/types";

export const watchlistApi = {
  list: (params?: URLSearchParams) =>
    api<{ data: MovieCardData[]; meta: PaginationMeta }>(`/api/watchlist?${params ?? ""}`),

  toggle: (movieId: number) =>
    api<{ data: { isInWatchlist: boolean } }>("/api/watchlist/toggle", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),
};
