import { api } from "@/lib/api/client";
import type { Tag, PaginationMeta, MovieRequest, Report, Series, Episode } from "@/types";

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

interface AdminSeason {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  episodeCount?: number;
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
  stats: () => api<{ data: { value: number }[] }>("/api/admin/stats"),

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

  featuredSeries: {
    list: () =>
      api<{ data: (AdminFeaturedItem & { seriesId: number })[] }>("/api/admin/featured-series"),

    create: (body: { seriesId: number }) =>
      api<void>("/api/admin/featured-series", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: number, body: { displayOrder: number }) =>
      api<void>(`/api/admin/featured-series/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: (id: number) =>
      api<void>(`/api/admin/featured-series/${id}`, { method: "DELETE" }),
  },

  movies: {
    search: (params: URLSearchParams) =>
      api<{ data: AdminSearchResult[]; meta: PaginationMeta }>(`/api/admin/movies?${params}`),
  },

  series: {
    getById: (id: number) =>
      api<{ data: Series }>(`/api/admin/series/${id}`),

    search: (params: URLSearchParams) =>
      api<{ data: AdminSearchResult[]; meta: PaginationMeta }>(`/api/admin/series?${params}`),
  },

  seasons: {
    list: (seriesId: number) =>
      api<{ data: AdminSeason[] }>(`/api/admin/series/${seriesId}/seasons`),

    create: (seriesId: number, body: { seasonNumber?: number; title?: string }) =>
      api<void>(`/api/admin/series/${seriesId}/seasons`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (seriesId: number, id: number, body: { seasonNumber?: number; title?: string }) =>
      api<void>(`/api/admin/series/${seriesId}/seasons/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: (seriesId: number, id: number) =>
      api<void>(`/api/admin/series/${seriesId}/seasons/${id}`, { method: "DELETE" }),
  },

  episodes: {
    list: (seriesId: number, seasonId: number) =>
      api<{ data: Episode[] }>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes`),

    create: (seriesId: number, seasonId: number, body: Record<string, unknown>) =>
      api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (seriesId: number, seasonId: number, id: number, body: Record<string, unknown>) =>
      api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: (seriesId: number, seasonId: number, id: number) =>
      api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes/${id}`, { method: "DELETE" }),
  },

  tags: {
    list: (params: URLSearchParams) =>
      api<{ data: Tag[]; meta: PaginationMeta }>(`/api/admin/tags?${params}`),

    create: (name: string) =>
      api<void>("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),

    update: (id: number, name: string) =>
      api<void>(`/api/admin/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
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
    search: (query: string, mediaType: "movie" | "tv" = "movie") =>
      api<{ results: { id: number; title: string; release_date: string; vote_average: number; overview: string; poster_path: string | null; original_language: string }[] }>("/api/admin/tmdb/search", {
        method: "POST",
        body: JSON.stringify({ query, mediaType }),
      }),

    import: (tmdbId: number, slug: string, mediaType: "movie" | "tv" = "movie", releaseDate?: string) =>
      api<TmdbImportResult>("/api/admin/tmdb/import", {
        method: "POST",
        body: JSON.stringify({ tmdbId, slug, mediaType, releaseDate }),
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
