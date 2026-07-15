import { api } from "@/lib/api/client";
import type { ShortsPage } from "@/types";

export const shortsApi = {
  list: (params?: { cursor?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.cursor) search.set("cursor", String(params.cursor));
    search.set("limit", String(params?.limit ?? 10));
    return api<ShortsPage>(`/api/shorts?${search}`);
  },
};
