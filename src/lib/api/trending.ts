import { api } from "@/lib/api/client";
import type { MovieCardData } from "@/types";

export const trendingApi = {
  list: () => api<{ trending: MovieCardData[] }>("/api/trending"),
};
