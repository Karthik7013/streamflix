"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { STALE } from "@/lib/stale-times";
import { apiFetch } from "@/lib/api/client";
import { type SortingState } from "@tanstack/react-table";

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

export function useAdminList<T>({ baseKey, endpoint, defaultLimit = 20, extraParams = {} }: UseAdminListOptions) {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const debouncedSearch = useDebounce(search, 300);
  const limit = defaultLimit;

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const extraParamsSerialized = JSON.stringify(extraParams);
  const queryKey = [baseKey, page, debouncedSearch, sortBy, sortDir, extraParamsSerialized];

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      for (const [key, val] of Object.entries(extraParams)) {
        if (val) params.set(key, val);
      }
      const res = await apiFetch(`${endpoint}?${params}`);
      const body: CrudListResponse<T> = await res.json();
      return body;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 0;

  return {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sorting,
    setSorting,
    limit,
    items,
    total,
    totalPages,
    loading,
    isError,
    retry,
  };
}