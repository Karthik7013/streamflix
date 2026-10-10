"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useAdminListBase } from "@/hooks/use-admin-list-base";

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
  const [statusFilter, setStatusFilterState] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null);
  const queryClient = useQueryClient();

  const filterStatusParam = useMemo(() => statusFilter === "all" ? "" : statusFilter, [statusFilter]);
  const extraParams: Record<string, string> = useMemo(() => {
    const params: Record<string, string> = {};
    if (filterStatusParam) params.status = filterStatusParam;
    return params;
  }, [filterStatusParam]);

  const list = useAdminListBase<MovieRequest>({
    baseKey: "admin-requests",
    queryFn: async ({ cursor, page, limit, search, sortBy, sortDir, extraParams: params }) => {
      const sp = new URLSearchParams({ limit: String(limit) });
      if (cursor) sp.set("cursor", String(cursor));
      else sp.set("page", String(page));
      if (params?.status && (params.status === "pending" || params.status === "fulfilled")) {
        sp.set("status", params.status);
      }
      if (search) sp.set("search", search);
      if (sortBy) sp.set("sortBy", sortBy);
      if (sortDir) sp.set("sortDir", sortDir);
      return adminApi.requests.list(sp);
    },
    defaultLimit: 50,
    defaultSorting: [],
    extraParams,
  });

  const { setPage, setSearch } = list;

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(1);
  }, [setPage]);

  const fulfillMutation = useMutation({
    mutationFn: (id: number) => adminApi.requests.fulfill(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    },
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
    ...list,
    requests: list.items,
    statusFilter, setStatusFilter,
    search: list.search,
    setSearch,
    deleteTarget, setDeleteTarget,
    movieDialogOpen, setMovieDialogOpen,
    prefillData, setPrefillData,
    handleFulfill, handleDelete,
    openCreateMovie, onMovieCreated,
    fulfillMutation, deleteMutation,
  };
}
