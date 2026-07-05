"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { type SortingState } from "@tanstack/react-table"
import { STALE } from "@/lib/stale-times"
import { apiFetch } from "@/lib/api/client"
import { adminApi } from "@/lib/api/admin"
import dynamic from "next/dynamic"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  { loading: () => <Skeleton className="h-96 rounded-lg" /> }
)
import StatusFilter from "@/components/status-filter"
import SearchInput from "../search-input"
import Pagination from "../pagination"
import DeleteEntityDialog from "../delete-entity-dialog"
import { ItemCount } from "@/components/item-count"
import type { PaginatedResponse } from "@/types"
import RequestsTable from "../requests-table"

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
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null)
  const [movieDialogOpen, setMovieDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null)

  const limit = 50
  const queryClient = useQueryClient()

  const sortBy = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? "desc" : "asc"

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-requests", page, statusFilter, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set("status", statusFilter)
      if (search) params.set("search", search)
      if (sortBy) params.set("sortBy", sortBy)
      if (sortDir) params.set("sortDir", sortDir)
      const data = await adminApi.requests.list(params);
      return data as unknown as PaginatedResponse<MovieRequest>
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  })

  const requests = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  const fulfillMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "fulfilled" }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-requests"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/admin/requests/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSettled: () => { setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["admin-requests"] }) },
  })

  useEffect(() => { queueMicrotask(() => setPage(1)) }, [statusFilter, search])

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

      <div className="flex items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />
        <StatusFilter
          options={["", "pending", "fulfilled"]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <CardTitle>{statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests` : "All Requests"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Failed to load requests." onRetry={refetch} className="py-8" />
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
