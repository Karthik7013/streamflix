import { api } from "@/lib/api/client";
import type { FeaturedItem, Series, PaginationMeta, Top10RowItem } from "@/types";

export const seriesApi = {
  getBySlug: (slug: string) => api<{ data: Series }>(`/api/series/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ data: Series[]; meta: PaginationMeta }>(`/api/series?${params ?? ""}`),

  featured: () => api<{ data: FeaturedItem[] }>("/api/series/featured"),

  top10: () => api<{ data: Top10RowItem[] }>("/api/series/top-10"),
};
