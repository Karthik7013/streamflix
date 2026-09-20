"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";

interface MovieRequest {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  status: "pending" | "fulfilled";
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
}

export function useAdminRequests() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState("all");
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null);
  const queryClient = useQueryClient();
  const cursorRef = useRef<number | undefined>(undefined);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(1);
    cursorRef.current = undefined;
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
    cursorRef.current = undefined;
  }, []);

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const filterStatusParam = statusFilter === "all" ? "" : statusFilter;
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: ["admin-requests", page, filterStatusParam, debouncedSearch, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursorRef.current) params.set("cursor", String(cursorRef.current));
      else params.set("page", String(page));
      if (filterStatusParam) params.set("status", filterStatusParam);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.requests.list(params);
    },
    staleTime: STALE.DEFAULT,
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data?.meta?.totalPages]);

  const goNext = useCallback(() => {
    if (requests.length > 0) {
      cursorRef.current = requests[requests.length - 1].id;
    }
    setPage((p) => p + 1);
  }, [requests]);

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

  const fulfillMutation = useMutation({
    mutationFn: (id: number) => adminApi.requests.fulfill(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-requests"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.requests.delete(id),
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
  });

  const handleFulfill = useCallback((request: MovieRequest) => fulfillMutation.mutate(request.id), [fulfillMutation]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);

  const openCreateMovie = useCallback((request: MovieRequest) => {
    setPrefillData({ title: request.title, description: request.description ?? undefined });
    setMovieDialogOpen(true);
  }, []);

  const onMovieCreated = useCallback(() => {
    setMovieDialogOpen(false);
    setPrefillData(null);
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }, [queryClient]);

  return {
    page,
    setPage: goToPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    movieDialogOpen, setMovieDialogOpen,
    prefillData, setPrefillData,
    requests, total, totalPages, limit,
    loading, isError, retry,
    goNext, goPrev,
    hasMore: data?.meta?.hasMore ?? false,
    handleFulfill, handleDelete,
    openCreateMovie, onMovieCreated,
    fulfillMutation, deleteMutation,
  };
}
