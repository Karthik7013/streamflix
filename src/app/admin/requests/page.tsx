"use client"

import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs"
import { type SortingState } from "@tanstack/react-table"
import { STALE } from "@/lib/stale-times"
import { adminApi } from "@/lib/api/admin"
import dynamic from "next/dynamic"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  { loading: () => <Skeleton className="h-96 rounded-lg" /> }
)
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { RequestsTable } from "@/app/admin/requests-table"
import { ItemCount } from "@/components/item-count"

interface RequestUser {
  name: string
  email: string
}

interface MovieRequest {
  id: number
  userId: string
  title: string
  description: string | null
  externalLink: string | null
  status: "pending" | "fulfilled"
  createdAt: string
  updatedAt: string
  user: RequestUser
}

export default function AdminRequestsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null)
  const [movieDialogOpen, setMovieDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null)

  const limit = 50
  const queryClient = useQueryClient()

  const sortBy = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? "desc" : "asc"

  const filterStatusParam = statusFilter === "all" ? "" : statusFilter

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-requests", page, filterStatusParam, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filterStatusParam) params.set("status", filterStatusParam)
      if (search) params.set("search", search)
      if (sortBy) params.set("sortBy", sortBy)
      if (sortDir) params.set("sortDir", sortDir)
      return adminApi.requests.list(params);
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  })

  const requests = useMemo(() => data?.data ?? [], [data?.data])
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total])
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 0, [data?.meta?.totalPages])

  const fulfillMutation = useMutation({
    mutationFn: async (id: number) => {
      await adminApi.requests.fulfill(id)
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-requests"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await adminApi.requests.delete(id)
    },
    onSettled: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["admin-requests"] }) },
  })

  useEffect(() => { queueMicrotask(() => setPage(1)) }, [filterStatusParam, search])

  function handleFulfill(request: MovieRequest) { fulfillMutation.mutate(request.id) }
  function handleDelete() { if (!deleteTarget) return; deleteMutation.mutate(deleteTarget.id) }

  function openCreateMovie(request: MovieRequest) {
    setPrefillData({ title: request.title, description: request.description ?? undefined })
    setMovieDialogOpen(true)
  }

  function onMovieCreated() {
    setMovieDialogOpen(false)
    setPrefillData(null)
    if (prefillData) {
      const match = requests.find(r => r.title === prefillData.title && r.status === "pending")
      if (match) fulfillMutation.mutate(match.id)
    }
  }

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
