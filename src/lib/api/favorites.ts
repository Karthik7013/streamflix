import { api } from "@/lib/api/client";

export interface FavoriteMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export interface FavoritesResponse {
  movies: FavoriteMovie[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const favoritesApi = {
  list: (params?: URLSearchParams) =>
    api<FavoritesResponse>(`/api/favorites?${params ?? ""}`),

  toggle: (movieId: number) =>
    api<{ isFavorited: boolean }>("/api/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),
};
