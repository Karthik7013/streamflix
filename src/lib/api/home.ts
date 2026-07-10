import { api } from "@/lib/api/client";
import type { Movie, MovieCardData } from "@/types";

export interface HomeFeaturedItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate: string | null;
  durationSeconds: number | null;
  tags: { id: number; name: string }[];
}

export interface HomeCategory {
  tag: { id: number; name: string };
  movies: MovieCardData[];
}

export const homeApi = {
  featured: () => api<{ featured: HomeFeaturedItem[] }>("/api/home/featured"),

  recentlyAdded: () =>
    api<{ recentlyAdded: Movie[] }>("/api/home/recently-added"),

  categories: () =>
    api<{ categories: HomeCategory[] }>("/api/home/categories"),
};
