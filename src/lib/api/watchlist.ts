import { api } from "@/lib/api/client";
import type { MovieCardData } from "@/types";

export interface WatchlistPage {
  data: MovieCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const watchlistApi = {
  list: (params?: URLSearchParams) =>
    api<WatchlistPage>(`/api/watchlist?${params ?? ""}`),

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
