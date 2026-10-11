"use client";

import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import type { Tag } from "@/types";

export function useAdminTagsList() {
  const list = useAdminListBase<Tag>({
    baseKey: queryKeys.adminTags(),
    queryFn: async ({ page, limit, search, sortBy, sortDir }) => {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.tags.list(params);
    },
    defaultLimit: 50,
    defaultSorting: [],
  });

  return {
    ...list,
    tags: list.items,
    totalPages: list.totalPages || 1,
  };
}
