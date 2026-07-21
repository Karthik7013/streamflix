"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs";
import { ErrorState } from "@/components/error-state";
import { SearchInput } from "@/app/admin/search-input";
import { Pagination } from "@/app/admin/pagination";
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog";
import { ItemCount } from "@/components/item-count";
import { ReportsTable } from "@/app/admin/reports-table";
import { useAdminReports } from "@/hooks/use-admin-reports";

export default function AdminReportsPage() {
  const {
    page, setPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    reports, total, totalPages, limit,
    isLoading, isError, refetch,
    handleToggleStatus, deleteMutation,
  } = useAdminReports();

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
