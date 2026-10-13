import { api } from "@/lib/api-client/client";
import type { Movie, MovieDetail, Comment, PaginationMeta, CommentsPage } from "@/types";

export const moviesApi = {
  getBySlug: (slug: string) => api<{ data: MovieDetail }>(`/api/movies/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ data: Movie[]; meta: PaginationMeta }>(`/api/movies?${params ?? ""}`),

  getComments: (slug: string, params?: URLSearchParams) =>
    api<CommentsPage>(`/api/movies/${slug}/comments?${params ?? ""}`),

  postComment: (slug: string, content: string) =>
    api<{ data: Comment }>(`/api/movies/${slug}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  report: (slug: string, description: string) =>
    api<void>(`/api/movies/${slug}/report`, {
      method: "POST",
      body: JSON.stringify({ description }),
    }),
};