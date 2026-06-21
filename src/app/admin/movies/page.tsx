"use client";

import { useState, useMemo } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorState } from "@/components/error-state"
import { MovieDialog } from "@/components/movie-dialog"
import { useDebounce } from "@/hooks/use-debounce"
import SearchInput from "../search-input"
import MoviesTable from "../movies-table"
import DeleteMovieDialog from "../delete-movie-dialog"

interface Tag {
  id: number
  name: string
}

interface Movie {
  id: number
  title: string
  slug: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  backdropUrl: string | null
  durationSeconds: number | null
  releaseDate: string | null
  createdAt: string
  updatedAt: string
  tags: Tag[]
}

interface PaginatedResponse {
  movies: Movie[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminMoviesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-movies", page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/admin/movies?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json() as Promise<PaginatedResponse>
    },
  })

  const movies = data?.movies ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  const deleteMutation = useMutation({
    mutationFn: async (movieId: number) => {
      const res = await fetch(`/api/admin/movies/${movieId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Movie deleted")
      setDeleteTarget(null)
      setDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["admin-movies"] })
    },
    onError: () => toast.error("Failed to delete movie"),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function openCreateDialog() {
    setEditingMovie(null)
    setDialogOpen(true)
  }

  function openEditDialog(movie: Movie) {
    setEditingMovie(movie)
    setDialogOpen(true)
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const limit = 20
  const startItem = useMemo(() => (page - 1) * limit + 1, [page])
  const endItem = useMemo(() => Math.min(page * limit, total), [page, total])

  const editInitialData = useMemo(() => editingMovie ? {
    title: editingMovie.title,
    slug: editingMovie.slug,
    description: editingMovie.description ?? "",
    videoUrl: editingMovie.videoUrl ?? "",
    thumbnailUrl: editingMovie.thumbnailUrl ?? "",
    backdropUrl: editingMovie.backdropUrl ?? "",
    durationSeconds: editingMovie.durationSeconds ? String(editingMovie.durationSeconds) : "",
    releaseDate: editingMovie.releaseDate ?? "",
    tagIds: editingMovie.tags.map((t) => t.id),
  } : undefined, [editingMovie])

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-h-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground mt-1">Manage your movie catalog.</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto shrink-0">
          <PlusIcon className="size-4" />
          Add Movie
        </Button>
      </div>

      <MovieDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingMovie ? editInitialData : undefined}
        editMovieId={editingMovie?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-movies"] })
        }}
      />

      <DeleteMovieDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null) }}
        movieTitle={deleteTarget?.title ?? null}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

        <Card className="flex flex-1 p-0 flex-col min-w-0 overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="border-b bg-muted/10 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <CardTitle>All Movies</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{total} movies registered</p>
              </div>
              <SearchInput value={search} onChange={setSearch} placeholder="Search by title..." />
            </div>
          </CardHeader>
          <CardContent className="p-0 relative min-w-0 overflow-auto">
            {isError ? (
              <ErrorState message="Failed to load movies." onRetry={refetch} className="py-8" />
            ) : (
              <div className="w-full">
                <MoviesTable movies={movies} loading={isLoading} onEdit={openEditDialog} onDelete={(m) => { setDeleteTarget(m); setDeleteDialogOpen(true) }} />
              </div>
            )}
          </CardContent>

        <div className="flex items-center justify-between p-4 border-t bg-muted/5 text-sm text-muted-foreground">
          <p className="hidden sm:block">
            Showing <span className="font-medium text-foreground">{startItem}</span> to <span className="font-medium text-foreground">{endItem}</span> of <span className="font-medium text-foreground">{total}</span> movies
          </p>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
