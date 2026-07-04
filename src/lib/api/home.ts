import { api } from "./client";
import type { Movie } from "@/types";

export const homeApi = {
  featured: () => api<{ items: { id: number; title: string; slug: string; thumbnailUrl: string; backdropUrl: string }[] }>("/api/home/featured"),

  recentlyAdded: () =>
    api<{ movies: Movie[] }>("/api/home/recently-added"),
};
