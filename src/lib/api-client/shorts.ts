import { api } from "@/lib/api-client/client";
import { SHORTS_LIMIT } from "@/lib/constants";
import type { ShortsPage } from "@/types";

export const shortsApi = {
  list: (params?: { cursor?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.cursor) search.set("cursor", String(params.cursor));
    search.set("limit", String(params?.limit ?? SHORTS_LIMIT));
    return api<ShortsPage>(`/api/shorts?${search}`);
  },
};