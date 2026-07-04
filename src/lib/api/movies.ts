import { api } from "./client";
import type { Movie, PaginatedResponse, Comment } from "@/types";

export const moviesApi = {
  getBySlug: (slug: string) => api<Movie>(`/api/movies/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ movies: Movie[]; total: number }>(`/api/movies?${params ?? ""}`),

  getRelated: (slug: string) => api<{ related: Movie[] }>(`/api/movies/${slug}/related`),

  getComments: (slug: string, page = 1) =>
    api<PaginatedResponse<Comment>>(`/api/movies/${slug}/comments?page=${page}`),

  postComment: (slug: string, content: string) =>
    api<{ comment: Comment }>(`/api/movies/${slug}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  report: (slug: string, reason: string) =>
    api<void>(`/api/movies/${slug}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
