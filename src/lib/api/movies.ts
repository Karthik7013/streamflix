import { api } from "@/lib/api/client";
import type { Movie, Comment, PaginationMeta } from "@/types";

export const moviesApi = {
  getBySlug: (slug: string) => api<{ data: Movie }>(`/api/movies/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ data: Movie[]; meta: PaginationMeta }>(`/api/movies?${params ?? ""}`),

  getRelated: (slug: string) => api<{ data: Movie[] }>(`/api/movies/${slug}/related`),

  getComments: (slug: string, params?: URLSearchParams) =>
    api<{ data: Comment[]; meta: PaginationMeta }>(`/api/movies/${slug}/comments?${params ?? ""}`),

  postComment: (slug: string, content: string) =>
    api<{ data: Comment }>(`/api/movies/${slug}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  report: (slug: string, reason: string) =>
    api<void>(`/api/movies/${slug}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
