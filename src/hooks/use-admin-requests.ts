"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null);
  const queryClient = useQueryClient();

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const filterStatusParam = statusFilter === "all" ? "" : statusFilter;

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: ["admin-requests", page, filterStatusParam, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatusParam) params.set("status", filterStatusParam);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.requests.list(params);
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data?.meta?.totalPages]);

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

  useEffect(() => { queueMicrotask(() => setPage(1)); }, [filterStatusParam, search]);

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
  }, []);

  return {
    page, setPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    movieDialogOpen, setMovieDialogOpen,
    prefillData, setPrefillData,
    requests, total, totalPages, limit,
    loading, isError, retry,
    handleFulfill, handleDelete,
    openCreateMovie, onMovieCreated,
    fulfillMutation, deleteMutation,
  };
}
