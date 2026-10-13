import { api } from "@/lib/api-client/client";
import type { Tag, MovieCardData } from "@/types";

export interface TagMoviesPage {
  data: MovieCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const tagsApi = {
  list: (params?: URLSearchParams) =>
    api<{ data: Tag[] }>(`/api/tags?${params ?? ""}`),

  movies: (slug: string, cursor?: string, limit = 12) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return api<TagMoviesPage>(`/api/tags/${slug}/movies?${params}`);
  },
};