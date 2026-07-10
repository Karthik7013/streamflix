import { api } from "@/lib/api/client";
import type { Movie, Comment } from "@/types";

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  hasMore: boolean;
}

export const moviesApi = {
  getBySlug: (slug: string) => api<Movie>(`/api/movies/${slug}`),

  list: (params?: URLSearchParams) =>
    api<{ movies: Movie[]; total: number }>(`/api/movies?${params ?? ""}`),

  getRelated: (slug: string) => api<{ related: Movie[] }>(`/api/movies/${slug}/related`),

  getComments: (slug: string, params?: URLSearchParams) =>
    api<CommentsResponse>(`/api/movies/${slug}/comments?${params ?? ""}`),

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
