import { api } from "@/lib/api/client";
import type { FeaturedItem, Movie } from "@/types";

export const homeApi = {
  featured: () => api<{ data: FeaturedItem[] }>("/api/home/featured"),

  top10: () =>
    api<{ data: Movie[] }>("/api/home/top-10"),
};
