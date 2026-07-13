import { api } from "@/lib/api/client";
import type { Series, PaginationMeta } from "@/types";

export const seriesApi = {
  getBySlug: (slug: string) => api<{ data: Series }>(`/api/series/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ data: Series[]; meta: PaginationMeta }>(`/api/series?${params ?? ""}`),

  featured: () => api<{ data: Series[] }>("/api/series/featured"),

  top10: () => api<{ data: Series[] }>("/api/series/top-10"),
};
