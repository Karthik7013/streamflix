import { api } from "@/lib/api/client";
import type { Tag, PaginatedResponse, MovieRequest, Report } from "@/types";

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

export const adminApi = {
  stats: () => api<{ stats: { value: number }[] }>("/api/admin/stats"),

  recentSignups: () => api<{ recentSignups: RecentSignup[] }>("/api/admin/recent-signups"),

  mostFavorited: () =>
    api<{ mostFavorited: MostFavoritedMovie[] }>("/api/admin/most-favorited"),

  tags: {
    list: (params: URLSearchParams) =>
      api<PaginatedResponse<Tag>>(`/api/admin/tags?${params}`),

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
      api<PaginatedResponse<MovieRequest>>(`/api/admin/requests?${params}`),
  },

  reports: {
    list: (params: URLSearchParams) =>
      api<PaginatedResponse<Report>>(`/api/admin/reports?${params}`),
  },

  upload: {
    file: (formData: FormData) =>
      api<{ url: string }>("/api/upload/file", {
        method: "POST",
        body: formData,
      }),

    avatar: (formData: FormData) =>
      api<{ url: string }>("/api/upload/avatar", {
        method: "POST",
        body: formData,
      }),

    delete: (url: string) =>
      api<void>(`/api/upload/file?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      }),
  },
};
