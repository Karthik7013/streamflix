"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { Tag } from "@/types";

export function useAdminTags() {
  const { data, isLoading, isError } = useQuery<Tag[]>({
    queryKey: ["admin-tags-select"],
    queryFn: async () => {
      const { data } = await adminApi.tags.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
  });

  return { allTags: data ?? [], isLoading, isError };
}
