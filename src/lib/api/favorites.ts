import { api } from "@/lib/api/client";
import type { PaginationMeta } from "@/types";

export interface FavoriteMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export const favoritesApi = {
  list: (params?: URLSearchParams) =>
    api<{ data: FavoriteMovie[]; meta: PaginationMeta }>(`/api/favorites?${params ?? ""}`),

  toggle: (movieId: number) =>
    api<{ data: { isFavorited: boolean } }>("/api/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),
};
