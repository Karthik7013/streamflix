import { api } from "@/lib/api/client";
import type { Series, PaginatedResponse } from "@/types";

export const seriesApi = {
  getBySlug: (slug: string) => api<Series>(`/api/series/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ series: Series[]; total: number }>(`/api/series?${params ?? ""}`),

  featured: () => api<{ featured: Series[] }>("/api/series/featured"),

  top10: () => api<{ top10: Series[] }>("/api/series/top-10"),
};
