"use client";

import { useEffect, useState, useRef, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { formatDuration } from "@/lib/format"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [local, setLocal] = useState(value)
  const syncRef = useRef(onChange)
  syncRef.current = onChange

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timeout = setTimeout(() => syncRef.current(local), 300)
    return () => clearTimeout(timeout)
  }, [local])

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-9 bg-background"
      />
    </div>
  )
}

const MovieRow = memo(function MovieRow({
  movie,
  onEdit,
  onDelete,
}: {
  movie: Movie
  onEdit: (m: Movie) => void
  onDelete: (m: Movie) => void
}) {
  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <Link href={`/movies/${movie.slug}`} className="flex items-center gap-3 group min-w-0">
          <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-muted-foreground/10">
            {movie.thumbnailUrl ? (
              <Image
                src={movie.thumbnailUrl}
                alt={movie.title}
                width={48}
                height={48}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="size-full flex items-center justify-center">
                <SearchIcon className="size-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
              {movie.title}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {movie.description}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap font-medium">
        {movie.releaseDate
          ? new Date(movie.releaseDate).getFullYear()
          : "—"}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {movie.durationSeconds ? formatDuration(movie.durationSeconds) : "—"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {movie.tags.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            movie.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="bg-primary text-primary-foreground border-none font-normal">
                {tag.name}
              </Badge>
            ))
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(movie)}>
            <PencilIcon className="size-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50" onClick={() => onDelete(movie)}>
            <Trash2Icon className="size-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </td>
    </tr>
  )
})

export default function AdminMoviesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
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
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages])
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
          <p className="text-muted-foreground mt-1">
            Manage your movie catalog.
          </p>
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
          toast.success(editingMovie ? "Movie updated" : "Movie created")
          queryClient.invalidateQueries({ queryKey: ["admin-movies"] })
        }}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Delete Movie</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
            This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2Icon className="size-4 animate-spin text-primary" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="flex flex-1 p-0 flex-col min-w-0 overflow-hidden border-muted/60 shadow-sm">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <CardTitle>All Movies</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {total} movies registered
              </p>
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by title..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 relative min-w-0 overflow-auto">
          <div className="w-full">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="size-12 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-12 shrink-0" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <div className="flex gap-2 shrink-0">
                      <Skeleton className="size-8 rounded-md" />
                      <Skeleton className="size-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : movies.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                No movies found matching your criteria.
              </div>
            ) : (
              <table className="w-full min-w-200">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-6 py-4 whitespace-nowrap">Title</th>
                    <th className="px-6 py-4 whitespace-nowrap">Release</th>
                    <th className="px-6 py-4 whitespace-nowrap">Duration</th>
                    <th className="px-6 py-4 whitespace-nowrap">Tags</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movies.map((movie) => (
                    <MovieRow key={movie.id} movie={movie} onEdit={openEditDialog} onDelete={(m) => { setDeleteTarget(m); setDeleteDialogOpen(true) }} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>

        <div className="flex items-center justify-between p-4 border-t bg-muted/5 text-sm text-muted-foreground">
            <p className="hidden sm:block">
              Showing <span className="font-medium text-foreground">{startItem}</span> to <span className="font-medium text-foreground">{endItem}</span> of <span className="font-medium text-foreground">{total}</span> movies
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                    className={cn(page <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {pageNumbers.map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); setPage(p); }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                    className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
      </Card>
    </div>
  )
}


function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]

  if (current > 3) {
    pages.push("ellipsis")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("ellipsis")
  }

  pages.push(total)

  return pages
}

