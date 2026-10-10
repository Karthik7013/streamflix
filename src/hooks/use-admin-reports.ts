"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { queryKeys } from "@/lib/query-keys";

interface VideoReport {
  id: number;
  movieId: number;
  userId: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  movie: { title: string; slug: string };
  user: { name: string; email: string };
}

export function useAdminReports() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilterState] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
  }, []);

  const list = useAdminListBase<VideoReport>({
    baseKey: queryKeys.adminReports[0],
    queryFn: async ({ cursor, page, limit, search, sortBy, sortDir, extraParams }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set("cursor", String(cursor));
      else params.set("page", String(page));
      const status = extraParams?.status;
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.reports.list(params);
    },
    defaultLimit: 50,
    defaultSorting: [],
    extraParams: { status: statusFilter === "all" ? "" : statusFilter },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending" | "resolved" }) =>
      adminApi.reports.resolve(id, status),
    onSettled: () => {
      setPendingActionId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminReports });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.reports.delete(id),
    onSettled: () => {
      setPendingDeleteId(null);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminReports });
    },
  });

  const handleToggleStatus = useCallback((report: VideoReport) => {
    setPendingActionId(report.id);
    const newStatus = report.status === "pending" ? "resolved" : "pending";
    resolveMutation.mutate({ id: report.id, status: newStatus });
  }, [resolveMutation]);

  const handleDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return {
    ...list,
    reports: list.items,
    statusFilter, setStatusFilter,
    deleteTarget, setDeleteTarget,
    pendingActionId, pendingDeleteId,
    handleToggleStatus, handleDelete,
    resolveMutation,
    deleteMutation,
  };
}