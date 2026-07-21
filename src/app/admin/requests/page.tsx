"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { RequestsTable } from "@/app/admin/requests-table"
import { ItemCount } from "@/components/item-count"
import { useAdminRequests } from "@/hooks/use-admin-requests"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  { loading: () => <Skeleton className="h-96 rounded-lg" /> }
)

export default function AdminRequestsPage() {
  const {
    page, setPage,
    statusFilter, setStatusFilter,
    search, setSearch,
    sorting, setSorting,
    deleteTarget, setDeleteTarget,
    movieDialogOpen, setMovieDialogOpen,
    prefillData, setPrefillData,
    requests, total, totalPages, limit,
    isLoading, isError, refetch,
    handleFulfill, handleDelete,
    openCreateMovie, onMovieCreated,
    deleteMutation,
  } = useAdminRequests()

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movie Requests</h1>
        <p className="text-muted-foreground mt-1">Manage user-submitted movie requests.</p>
      </div>

      {movieDialogOpen && (
        <MovieDialog open={movieDialogOpen} onOpenChange={(open) => { setMovieDialogOpen(open); if (!open) setPrefillData(null) }}
          initialData={prefillData ?? undefined} onSuccess={onMovieCreated} />
      )}

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex flex-col gap-3">
            <TabsRoot value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setPage(1) }}>
              <TabsList>
                <TabsTab value="all">All</TabsTab>
                <TabsTab value="pending">Pending</TabsTab>
                <TabsTab value="fulfilled">Fulfilled</TabsTab>
              </TabsList>
            </TabsRoot>
            <div className="flex items-center justify-between">
              <CardTitle>{statusFilter === "all" ? "All Requests" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests`}</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load requests." onRetry={refetch} className="py-8" />
          ) : (
            <RequestsTable requests={requests} loading={isLoading} sorting={sorting} onSortingChange={setSorting} onFulfill={handleFulfill} onOpenCreateMovie={openCreateMovie} onSetDeleteTarget={setDeleteTarget} />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />

      <DeleteEntityDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        entityLabel="Request"
        entityName={deleteTarget?.title ?? null}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
