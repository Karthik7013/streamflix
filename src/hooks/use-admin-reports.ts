"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);
  const queryClient = useQueryClient();

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const filterStatusParam = statusFilter === "all" ? "" : statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-reports", page, filterStatusParam, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatusParam) params.set("status", filterStatusParam);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.reports.list(params);
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const reports = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data?.meta?.totalPages]);

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending" | "resolved" }) =>
      adminApi.reports.resolve(id, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.reports.delete(id),
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [filterStatusParam, search]);

  const handleToggleStatus = (report: VideoReport) => {
    const newStatus = report.status === "pending" ? "resolved" : "pending";
    resolveMutation.mutate({ id: report.id, status: newStatus });
  };

  return {
    page, setPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    reports, total, totalPages, limit,
    isLoading, isError, refetch,
    handleToggleStatus,
    resolveMutation,
    deleteMutation,
  };
}
