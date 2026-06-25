"use client"

import { useEffect, useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { type SortingState } from "@tanstack/react-table"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  { loading: () => <Skeleton className="h-96 rounded-lg" /> }
)
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2Icon } from "lucide-react"
import SearchInput from "../search-input"
import Pagination from "../pagination"
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

interface PaginatedResponse {
  requests: MovieRequest[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminRequestsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null)
  const [movieDialogOpen, setMovieDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null)

  const limit = 20
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
      const res = await fetch(`/api/admin/requests?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json() as Promise<PaginatedResponse>
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const requests = data?.requests ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  const fulfillMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/requests/${id}`, {
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
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" })
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

  const startItem = useMemo(() => (page - 1) * limit + 1, [page])
  const endItem = useMemo(() => Math.min(page * limit, total), [page, total])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movie Requests</h1>
        <p className="text-muted-foreground mt-1">Manage user-submitted movie requests.</p>
      </div>

      <MovieDialog open={movieDialogOpen} onOpenChange={(open) => { setMovieDialogOpen(open); if (!open) setPrefillData(null) }}
        initialData={prefillData ?? undefined} onSuccess={onMovieCreated} />

      <div className="flex items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />
        {["", "pending", "fulfilled"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={`Showing ${startItem}–${endItem} of ${total} requests`} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogTitle>Delete Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the request for <strong>{deleteTarget?.title}</strong>?
            This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <DialogClose render={<Button variant="outline">Cancel</Button>} onClick={() => setDeleteTarget(null)} />
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
