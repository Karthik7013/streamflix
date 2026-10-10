"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";

export function useAdminTagsList() {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: [...queryKeys.adminTags, page, debouncedSearch, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.tags.list(params);
    },
    staleTime: STALE.DEFAULT,
  });

  const tags = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 1, [data?.meta?.totalPages]);

  const goNext = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    setPage(targetPage <= 1 ? 1 : targetPage);
  }, []);

  return {
    page,
    setPage: goToPage,
    search, setSearch,
    sorting, setSorting,
    tags, total, totalPages, limit,
    loading, isError, retry,
    goNext, goPrev,
    hasMore: data?.meta?.hasMore ?? false,
  };
}
