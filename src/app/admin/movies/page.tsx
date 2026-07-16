"use client";

import { useState, useMemo } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { useAdminCrud } from "@/hooks/use-admin-crud"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { MoviesTable } from "@/app/admin/movies-table"
import { ItemCount } from "@/components/item-count"
import dynamic from "next/dynamic"

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
  trailerUrl: string | null
  durationSeconds: number | null
  releaseDate: string | null
  originalLanguage: string | null
  tmdbId: number | null
  published: boolean
  createdAt: string
  updatedAt: string
  tags: { id: number; name: string }[]
}

export default function AdminMoviesPage() {
  const [publishedFilter, setPublishedFilter] = useState("all")

  const extraParams = useMemo(() => {
    if (publishedFilter === "all") return undefined
    return { published: publishedFilter === "published" ? "true" : "false" }
  }, [publishedFilter])

  const {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    items: movies, total, totalPages,
    isLoading, isError, refetch,
    deleteMutation, invalidateList,
  } = useAdminCrud<Movie>({ baseKey: "admin-movies", endpoint: "/api/admin/movies", defaultLimit: 50, extraParams })

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

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteDialogOpen(false)
    } catch {
      // error toast handled by mutation's onError; dialog stays open for retry
    }
  }

  const editInitialData = useMemo(() => editingMovie ? {
    title: editingMovie.title,
    slug: editingMovie.slug,
    description: editingMovie.description ?? "",
    videoUrl: editingMovie.videoUrl ?? "",
    thumbnailUrl: editingMovie.thumbnailUrl ?? "",
    backdropUrl: editingMovie.backdropUrl ?? "",
    trailerUrl: editingMovie.trailerUrl ?? "",
    durationSeconds: editingMovie.durationSeconds ? String(editingMovie.durationSeconds) : "",
    releaseDate: editingMovie.releaseDate ?? "",
    originalLanguage: editingMovie.originalLanguage ?? "",
    tagIds: editingMovie.tags.map((t) => t.id),
    tmdbId: editingMovie.tmdbId ?? undefined,
    published: editingMovie.published ?? false,
  } : undefined, [editingMovie])

  const limit = 50
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 h-full">
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

      {dialogOpen && (
        <MovieDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialData={editingMovie ? editInitialData : undefined}
          editMovieId={editingMovie?.id}
          onSuccess={invalidateList}
        />
      )}

      <DeleteEntityDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null) }}
        entityLabel="Movie"
        entityName={deleteTarget?.title ?? null}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              {["all", "draft", "published"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setPublishedFilter(f); setPage(1) }}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    publishedFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {f === "all" ? "All" : f === "draft" ? "Draft" : "Published"}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <CardTitle>All Movies</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search by title..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load titles." onRetry={refetch} className="py-8" />
          ) : (
            <MoviesTable movies={movies} loading={isLoading} sorting={sorting} onSortingChange={setSorting} onEdit={openEditDialog} onDelete={(m) => { setDeleteTarget(m); setDeleteDialogOpen(true) }} />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
