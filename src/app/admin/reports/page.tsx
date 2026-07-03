"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";
import StatusFilter from "@/components/status-filter";
import SearchInput from "../search-input";
import Pagination from "../pagination";
import DeleteEntityDialog from "../delete-entity-dialog";
import { ItemCount } from "@/components/item-count";
import { STALE } from "@/lib/stale-times";

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

interface PaginatedResponse {
  items: VideoReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VideoReport | null>(null);

  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-reports", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<PaginatedResponse>;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const reports = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSettled: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [statusFilter, search]);

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

      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search reports..."
        />
        <StatusFilter
          options={["", "pending", "resolved"]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <CardTitle>
            {statusFilter
              ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports`
              : "All Reports"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState
              message="Failed to load reports."
              onRetry={refetch}
              className="py-8"
            />
          ) : isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-none" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Flag className="size-12 mb-3 opacity-30" />
              <p className="text-sm">No reports found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {report.movie.title}
                      </span>
                      <Badge
                        variant={
                          report.status === "pending" ? "default" : "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        by {report.user.name} ({report.user.email})
                      </span>
                      <span>&middot;</span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(report)}
                      disabled={resolveMutation.isPending}
                    >
                      {report.status === "pending" ? "Mark Resolved" : "Reopen"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(report)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        label={<ItemCount from={startItem} to={endItem} total={total} />}
      />

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
