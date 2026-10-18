"use client";

import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { adminApi } from "@/lib/api-client/admin";
import { queryKeys } from "@/lib/query-keys";
import type { Person } from "@/types";

export function useAdminPeopleList() {
  const list = useAdminListBase<Person>({
    baseKey: queryKeys.adminPeople(),
    queryFn: async ({ page, limit, search, sortBy, sortDir }) => {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.people.list(params);
    },
    defaultLimit: 50,
    defaultSorting: [],
  });

  return {
    ...list,
    people: list.items,
    totalPages: list.totalPages || 1,
  };
}
