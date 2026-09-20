"use client";

import { useState, useCallback, useMemo, useRef } from "react";
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

export function useAdminList<T extends { id: number }>({ baseKey, endpoint, defaultLimit = 20, extraParams = {} }: UseAdminListOptions) {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const debouncedSearch = useDebounce(search, 300);
  const limit = defaultLimit;
  const cursorRef = useRef<number | undefined>(undefined);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
    cursorRef.current = undefined;
  }, []);

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const extraParamsSerialized = new URLSearchParams(extraParams).toString();
  const queryKey = [baseKey, page, debouncedSearch, sortBy, sortDir, extraParamsSerialized];

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursorRef.current) params.set("cursor", String(cursorRef.current));
      else params.set("page", String(page));
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
  });

  const items = useMemo(() => data?.data ?? [], [data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data]);

  const goNext = useCallback(() => {
    if (items.length > 0) {
      cursorRef.current = items[items.length - 1].id;
    }
    setPage((p) => p + 1);
  }, [items]);

  const goPrev = useCallback(() => {
    cursorRef.current = undefined;
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage <= 1) {
      cursorRef.current = undefined;
      setPage(1);
    } else {
      cursorRef.current = undefined;
      setPage(targetPage);
    }
  }, []);

  return {
    page,
    setPage: goToPage,
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
    goNext,
    goPrev,
    hasMore: data?.meta?.hasMore ?? false,
  };
}