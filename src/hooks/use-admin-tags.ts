"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { STALE } from "@/lib/stale-times";
import type { Tag } from "@/types";
import { queryKeys } from "@/lib/query-keys";

export function useAdminTags() {
  const { data, isLoading: loading, isError, refetch } = useQuery<Tag[]>({
    queryKey: queryKeys.adminTagsSelect,
    queryFn: async () => {
      const { data } = await adminApi.tags.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
    gcTime: STALE.THIRTY_MIN,
  });

  const allTags = useMemo(() => data ?? [], [data]);

  return { allTags, loading, isError, retry: refetch };
}
