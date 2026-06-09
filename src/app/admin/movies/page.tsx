"use client"

import { useEffect, useState, useCallback } from "react"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

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

interface MovieFormData {
  title: string
  slug: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: string
  releaseDate: string
  tagIds: number[]
}

const emptyForm: MovieFormData = {
  title: "",
  slug: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  durationSeconds: "",
  releaseDate: "",
  tagIds: [],
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [form, setForm] = useState<MovieFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [allTags, setAllTags] = useState<Tag[]>([])

  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

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

  useEffect(() => {
    if (!dialogOpen) fetchTags()
  }, [dialogOpen])

  async function fetchTags() {
    try {
      const res = await fetch("/api/admin/tags?limit=100")
      if (!res.ok) throw new Error("Failed to fetch tags")
      const data = await res.json()
      setAllTags(data.tags ?? [])
    } catch {
      // silent
    }
  }

  function openCreateDialog() {
    setEditingMovie(null)
    setForm(emptyForm)
    setSlugManuallyEdited(false)
    setDialogOpen(true)
  }

  function openEditDialog(movie: Movie) {
    setEditingMovie(movie)
    setForm({
      title: movie.title,
      slug: movie.slug,
      description: movie.description ?? "",
      videoUrl: movie.videoUrl,
      thumbnailUrl: movie.thumbnailUrl,
      durationSeconds: String(movie.durationSeconds),
      releaseDate: movie.releaseDate ?? "",
      tagIds: movie.tags.map((t) => t.id),
    })
    setSlugManuallyEdited(true)
    setDialogOpen(true)
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited
        ? prev.slug
        : title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        ...form,
        durationSeconds: parseInt(form.durationSeconds) || 0,
        tagIds: form.tagIds,
        releaseDate: form.releaseDate || null,
      }

      if (editingMovie) {
        const res = await fetch(`/api/admin/movies/${editingMovie.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch("/api/admin/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Create failed")
      }

      setDialogOpen(false)
      fetchMovies()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
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

  function toggleTag(tagId: number) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMovie ? "Edit Movie" : "Add Movie"}</DialogTitle>
            <DialogDescription>
              {editingMovie
                ? "Update the movie details below."
                : "Fill in the details to add a new movie."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Movie title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }}
                  placeholder="movie-slug"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Movie description"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Thumbnail URL</label>
                <Input
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Input
                  type="number"
                  value={form.durationSeconds}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationSeconds: e.target.value }))}
                  placeholder="3600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Release Date</label>
                <Input
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors",
                      form.tagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <span className="text-sm text-muted-foreground">No tags available.</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin text-primary" />}
              {editingMovie ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                              alt=""
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
                          <AlertDialog>
                            <AlertDialogTrigger onClick={() => setDeleteTarget(movie)}>
                              <Trash2Icon className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
                                This action cannot be undone.
                              </AlertDialogDescription>
                              <div className="flex justify-end gap-2 mt-6">
                                <AlertDialogClose
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
                            </AlertDialogContent>
                          </AlertDialog>
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
