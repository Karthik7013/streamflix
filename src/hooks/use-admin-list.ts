"use client";

import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { apiFetch } from "@/lib/api/client";

interface CrudListResponse<T> {
  data: T[];
  meta: { total: number; totalPages: number; page: number; limit: number; hasMore: boolean };
}

interface UseAdminListOptions {
  baseKey: string;
  endpoint: string;
  defaultLimit?: number;
  extraParams?: Record<string, string>;
}

export function useAdminList<T extends { id: number }>({ baseKey, endpoint, defaultLimit = 20, extraParams = {} }: UseAdminListOptions) {
  return useAdminListBase<T>({
    baseKey,
    defaultLimit,
    extraParams,
    queryFn: async ({ cursor, page, limit, search, sortBy, sortDir, extraParams: params }) => {
      const sp = new URLSearchParams({ limit: String(limit) });
      if (cursor) sp.set("cursor", String(cursor));
      else sp.set("page", String(page));
      if (search) sp.set("search", search);
      if (sortBy) sp.set("sortBy", sortBy);
      if (sortDir) sp.set("sortDir", sortDir);
      if (params) {
        for (const [key, val] of Object.entries(params)) {
          if (val) sp.set(key, val);
        }
      }
      const res = await apiFetch(`${endpoint}?${sp}`);
      const body: CrudListResponse<T> = await res.json();
      return body;
    },
  });
}
