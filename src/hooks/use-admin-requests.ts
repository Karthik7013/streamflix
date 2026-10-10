"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { queryKeys } from "@/lib/query-keys";

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
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilterState] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
  }, []);

  const list = useAdminListBase<MovieRequest>({
    baseKey: queryKeys.adminRequests[0],
    queryFn: async ({ page, limit, search, sortBy, sortDir, extraParams }) => {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      const status = extraParams?.status;
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.requests.list(params);
    },
    defaultLimit: 50,
    defaultSorting: [],
    extraParams: { status: statusFilter === "all" ? "" : statusFilter },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: number) => adminApi.requests.fulfill(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminRequests }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.requests.delete(id),
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminRequests });
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
    queryClient.invalidateQueries({ queryKey: queryKeys.adminRequests });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminMovies });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
  }, [queryClient]);

  return {
    ...list,
    requests: list.items,
    statusFilter, setStatusFilter,
    deleteTarget, setDeleteTarget,
    movieDialogOpen, setMovieDialogOpen,
    prefillData, setPrefillData,
    handleFulfill, handleDelete,
    openCreateMovie, onMovieCreated,
    fulfillMutation, deleteMutation,
  };
}