"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs";
import { ErrorState } from "@/components/error-state";
import { SearchInput } from "@/app/admin/search-input";
import { Pagination } from "@/app/admin/pagination";
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog";
import { ItemCount } from "@/components/item-count";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { ReportsTable } from "@/app/admin/reports-table";
import { type SortingState } from "@tanstack/react-table";

interface ReportMovie {
  title: string;
  slug: string;
}

interface ReportUser {
  name: string;
  email: string;
}

interface VideoReport {
  id: number;
  movieId: number;
  userId: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  movie: ReportMovie;
  user: ReportUser;
}
export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);

  const limit = 50;
  const queryClient = useQueryClient();

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
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "resolved" }) => {
      await adminApi.reports.resolve(id, status);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await adminApi.reports.delete(id);
    },
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [filterStatusParam, search]);

  function handleToggleStatus(report: VideoReport) {
    const newStatus = report.status === "pending" ? "resolved" : "pending";
    resolveMutation.mutate({ id: report.id, status: newStatus });
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Issue Reports</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user-submitted video issue reports.
        </p>
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex flex-col gap-3">
            <TabsRoot value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setPage(1) }}>
              <TabsList>
                <TabsTab value="all">All</TabsTab>
                <TabsTab value="pending">Pending</TabsTab>
                <TabsTab value="resolved">Resolved</TabsTab>
              </TabsList>
            </TabsRoot>
            <div className="flex items-center justify-between">
              <CardTitle>{statusFilter === "all" ? "All Reports" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports`}</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search reports..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load reports." onRetry={refetch} className="py-8" />
          ) : (
            <ReportsTable reports={reports} loading={isLoading} sorting={sorting} onSortingChange={setSorting} onToggleStatus={handleToggleStatus} onSetDeleteTarget={setDeleteTarget} />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />

      <DeleteEntityDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        entityLabel="Report"
        entityName={deleteTarget ? `report for ${deleteTarget.movie.title}` : null}
        onDelete={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
