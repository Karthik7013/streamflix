"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { Tag } from "@/types";

export function useAdminTags() {
  const { data, isLoading: loading, isError, refetch } = useQuery<Tag[]>({
    queryKey: ["admin-tags-select"],
    queryFn: async () => {
      const { data } = await adminApi.tags.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
  });

  const allTags = useMemo(() => data ?? [], [data]);

  return { allTags, loading, isError, retry: refetch };
}
