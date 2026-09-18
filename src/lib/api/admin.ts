import { api } from "@/lib/api/client";
import type { Tag, PaginationMeta, MovieRequest, Report } from "@/types";

interface RecentSignup {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

interface MostFavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favoriteCount: number;
}

interface AdminFeaturedItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

interface TmdbImportResult {
  title: string;
  overview: string;
  releaseDate: string;
  originalLanguage: string;
  tmdbId: number;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
}

interface AdminSearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export const adminApi = {
  stats: () => api<{ data: { type: string; value: number; subtitle?: string; percent?: number }[]; growth: { month: string; count: number }[] }>("/api/admin/stats"),

  recentSignups: () => api<{ data: RecentSignup[] }>("/api/admin/recent-signups"),

  mostFavorited: () =>
    api<{ data: MostFavoritedMovie[] }>("/api/admin/most-favorited"),

  featured: {
    list: () =>
      api<{ data: (AdminFeaturedItem & { movieId: number })[] }>("/api/admin/featured"),

    create: (body: { movieId: number }) =>
      api<void>("/api/admin/featured", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: number, body: { displayOrder: number }) =>
      api<void>(`/api/admin/featured/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: (id: number) =>
      api<void>(`/api/admin/featured/${id}`, { method: "DELETE" }),
  },

  movies: {
    search: (params: URLSearchParams) =>
      api<{ data: AdminSearchResult[]; meta: PaginationMeta }>(`/api/admin/movies?${params}`),

    delete: (id: number) =>
      api<void>(`/api/admin/movies/${id}`, { method: "DELETE" }),
  },

  tags: {
    list: (params: URLSearchParams) =>
      api<{ data: Tag[]; meta: PaginationMeta }>(`/api/admin/tags?${params}`),

    create: (name: string, imageUrl?: string) =>
      api<void>("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({ name, imageUrl: imageUrl || undefined }),
      }),

    update: (id: number, name: string, imageUrl?: string) =>
      api<void>(`/api/admin/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, imageUrl: imageUrl || undefined }),
      }),

    delete: (id: number) =>
      api<void>(`/api/admin/tags/${id}`, { method: "DELETE" }),
  },

  requests: {
    list: (params: URLSearchParams) =>
      api<{ data: MovieRequest[]; meta: PaginationMeta }>(`/api/admin/requests?${params}`),

    fulfill: (id: number) =>
      api<void>(`/api/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "fulfilled" }),
      }),

    delete: (id: number) =>
      api<void>(`/api/admin/requests/${id}`, { method: "DELETE" }),
  },

  reports: {
    list: (params: URLSearchParams) =>
      api<{ data: Report[]; meta: PaginationMeta }>(`/api/admin/reports?${params}`),

    resolve: (id: number, status: "pending" | "resolved") =>
      api<void>(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    delete: (id: number) =>
      api<void>(`/api/admin/reports/${id}`, { method: "DELETE" }),
  },

  tmdb: {
    search: (query: string) =>
      api<{ results: { id: number; title: string; release_date: string; vote_average: number; overview: string; poster_path: string | null; original_language: string }[] }>("/api/admin/tmdb/search", {
        method: "POST",
        body: JSON.stringify({ query }),
      }),

    import: (tmdbId: number, slug: string, releaseDate?: string) =>
      api<TmdbImportResult>("/api/admin/tmdb/import", {
        method: "POST",
        body: JSON.stringify({ tmdbId, slug, releaseDate }),
      }),
  },

  upload: {
    file: (formData: FormData) =>
      api<{ data: { publicUrl: string } }>("/api/upload/file", {
        method: "POST",
        body: formData,
      }),

    avatar: (formData: FormData) =>
      api<{ data: { publicUrl: string } }>("/api/upload/avatar", {
        method: "POST",
        body: formData,
      }),

    cover: (formData: FormData) =>
      api<{ data: { publicUrl: string } }>("/api/upload/cover", {
        method: "POST",
        body: formData,
      }),

    delete: (url: string) =>
      api<void>(`/api/upload/file?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      }),
  },
};
