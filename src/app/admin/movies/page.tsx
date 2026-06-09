"use client"

import { useEffect, useState, useCallback } from "react"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { MovieDialog } from "@/components/movie-dialog"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface Tag {
  id: number
  name: string
  createdAt: string
  movieCount?: number
}

interface Movie {
  id: number
  title: string
  slug: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
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
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/admin/movies?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: PaginatedResponse = await res.json()
      setMovies(data.movies)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

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
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/movies/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      setDeleteTarget(null)
      fetchMovies()
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const limit = 20
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movies</h1>
          <p className="text-muted-foreground mt-1">
            Manage your movie catalog.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon className="size-4" />
          Add Movie
        </Button>
      </div>

      <MovieDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingMovie ? {
          title: editingMovie.title,
          slug: editingMovie.slug,
          description: editingMovie.description ?? "",
          videoUrl: editingMovie.videoUrl,
          thumbnailUrl: editingMovie.thumbnailUrl,
          durationSeconds: String(editingMovie.durationSeconds),
          releaseDate: editingMovie.releaseDate ?? "",
          tagIds: editingMovie.tags.map((t) => t.id),
        } : undefined}
        editMovieId={editingMovie?.id}
        onSuccess={fetchMovies}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Movies</CardTitle>
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-6 animate-spin text-primary" />
            </div>
          ) : movies.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No movies found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Year / Release</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie) => (
                    <tr key={movie.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {movie.thumbnailUrl && (
                            <img
                              src={movie.thumbnailUrl}
                              alt={movie.title}
                              className="size-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{movie.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {movie.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {movie.releaseDate
                          ? new Date(movie.releaseDate).getFullYear()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDuration(movie.durationSeconds)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {movie.tags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            movie.tags.map((tag) => (
                              <Badge key={tag.id} variant="secondary">
                                {tag.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(movie)}
                          >
                            <PencilIcon className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Dialog>
                            <DialogTrigger onClick={() => setDeleteTarget(movie)}>
                              <Trash2Icon className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>Delete Movie</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
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
                                  {deleting && <Loader2Icon className="size-4 animate-spin text-primary" />}
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
            Showing {startItem}–{endItem} of {total} movies
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
    </div>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
