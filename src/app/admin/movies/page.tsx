"use client";

import { useState, useMemo } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import dynamic from "next/dynamic"
import { useAdminCrud } from "@/hooks/use-admin-crud"
import SearchInput from "../search-input"
import MoviesTable from "../movies-table"
import DeleteMovieDialog from "../delete-movie-dialog"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  {
    loading: () => <Skeleton className="h-96 rounded-lg" />,
  }
)

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
  tags: { id: number; name: string }[]
}

export default function AdminMoviesPage() {
  const {
    page, setPage,
    search, setSearch,
    items: movies, total, totalPages,
    isLoading, isError, refetch,
    deleteMutation, invalidateList,
  } = useAdminCrud<Movie>({ baseKey: "admin-movies", endpoint: "/api/admin/movies", defaultLimit: 20 })

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
    setDeleteTarget(null)
    setDeleteDialogOpen(false)
  }

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

  const limit = 20
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

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
        onSuccess={invalidateList}
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
