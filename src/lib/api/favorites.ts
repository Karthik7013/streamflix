import { api } from "@/lib/api/client";

export const favoritesApi = {
  list: () => api<{ movies: { id: number; title: string; slug: string; thumbnailUrl: string }[] }>("/api/favorites"),

  toggle: (movieId: number) =>
    api<{ isFavorited: boolean }>("/api/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),
};
