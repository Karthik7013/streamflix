"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { STALE } from "@/lib/stale-times";
import { type SortingState } from "@tanstack/react-table";

interface ListResponse<T> {
  data: T[];
  meta: { total: number; totalPages: number; page: number; limit: number; hasMore: boolean };
}

export interface UseAdminListBaseOptions<T> {
  baseKey: string;
  queryFn: (params: {
    cursor?: number;
    page: number;
    limit: number;
    search: string;
    sortBy?: string;
    sortDir?: string;
    extraParams?: Record<string, string>;
  }) => Promise<ListResponse<T>>;
  defaultLimit?: number;
  defaultSorting?: SortingState;
  extraParams?: Record<string, string>;
}

export function useAdminListBase<T extends { id: number }>({
  baseKey,
  queryFn,
  defaultLimit = 20,
  defaultSorting = [{ id: "createdAt", desc: true }],
  extraParams,
}: UseAdminListBaseOptions<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
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

  const extraParamsSerialized = useMemo(
    () => new URLSearchParams(extraParams ?? {}).toString(),
    [extraParams],
  );
  const queryKey = [baseKey, page, debouncedSearch, sortBy, sortDir, extraParamsSerialized];

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey,
    queryFn: async () => {
      return queryFn({
        cursor: cursorRef.current,
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortDir,
        extraParams,
      });
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