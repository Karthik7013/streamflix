"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState("all");
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const filterStatusParam = statusFilter === "all" ? "" : statusFilter;
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: ["admin-reports", page, filterStatusParam, debouncedSearch, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatusParam) params.set("status", filterStatusParam);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.reports.list(params);
    },
    staleTime: STALE.DEFAULT,
  });

  const reports = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data?.meta?.totalPages]);

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending" | "resolved" }) =>
      adminApi.reports.resolve(id, status),
    onSettled: () => {
      setPendingActionId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.reports.delete(id),
    onSettled: () => {
      setPendingDeleteId(null);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
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
    page, setPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    reports, total, totalPages, limit,
    loading, isError, retry,
    pendingActionId, pendingDeleteId,
    handleToggleStatus, handleDelete,
    resolveMutation,
    deleteMutation,
  };
}
