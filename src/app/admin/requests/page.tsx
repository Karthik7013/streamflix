"use client"

import { useEffect, useState, useCallback } from "react"
import { Trash2Icon, CheckIcon, PlusIcon, Loader2Icon, ExternalLinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { MovieDialog } from "@/components/movie-dialog"

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
  const [requests, setRequests] = useState<MovieRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<MovieRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [movieDialogOpen, setMovieDialogOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{ title: string; description?: string } | null>(null)

  const limit = 20

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/requests?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: PaginatedResponse = await res.json()
      setRequests(data.requests)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  async function handleFulfill(request: MovieRequest) {
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "fulfilled" }),
      })
      if (!res.ok) throw new Error("Failed")
      fetchRequests()
    } catch {
      // silent
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/requests/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      setDeleteTarget(null)
      fetchRequests()
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  function openCreateMovie(request: MovieRequest) {
    setPrefillData({
      title: request.title,
      description: request.description ?? undefined,
    })
    setMovieDialogOpen(true)
  }

  async function onMovieCreated() {
    setMovieDialogOpen(false)
    setPrefillData(null)
    // Mark the request as fulfilled after movie is created
    if (prefillData) {
      // Find the request by title match for auto-fulfill
      const match = requests.find(r => r.title === prefillData.title && r.status === "pending")
      if (match) {
        await fetch(`/api/admin/requests/${match.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "fulfilled" }),
        }).catch(() => {})
      }
    }
    fetchRequests()
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Movie Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage user-submitted movie requests.
        </p>
      </div>

      <MovieDialog
        open={movieDialogOpen}
        onOpenChange={(open) => { setMovieDialogOpen(open); if (!open) setPrefillData(null) }}
        initialData={prefillData ?? undefined}
        onSuccess={onMovieCreated}
      />

      <div className="flex gap-2">
        {["", "pending", "fulfilled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests` : "All Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Requester</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Link</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{req.title}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{req.user.name}</div>
                        <div className="text-xs text-muted-foreground">{req.user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {req.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {req.externalLink ? (
                          <a
                            href={req.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Link <ExternalLinkIcon className="size-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={req.status === "fulfilled" ? "default" : "secondary"}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFulfill(req)}
                                title="Mark as fulfilled"
                                className="size-8"
                              >
                                <CheckIcon className="size-3.5" />
                                <span className="sr-only">Fulfill</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openCreateMovie(req)}
                                title="Create movie from request"
                                className="size-8"
                              >
                                <PlusIcon className="size-3.5" />
                                <span className="sr-only">Create Movie</span>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(req)}
                            title="Delete request"
                            className="size-8"
                          >
                            <Trash2Icon className="size-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {startItem}–{endItem} of {total} requests
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogTitle>Delete Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the request for <strong>{deleteTarget?.title}</strong>?
            This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <DialogClose
              render={<Button variant="outline">Cancel</Button>}
              onClick={() => setDeleteTarget(null)}
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
