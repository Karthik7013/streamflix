"use client";

import { useState, useMemo, useCallback } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { logger } from "@/lib/logger"
import { adminApi } from "@/lib/api/admin"
import { useAdminListBase } from "@/hooks/use-admin-list-base"
import { useAdminEntityDelete } from "@/hooks/use-admin-entity-delete"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { MoviesTable } from "@/app/admin/movies-table"
import { ItemCount } from "@/components/item-count"
import { queryKeys } from "@/lib/query-keys"
import { toMovieFormData } from "@/lib/movie-form"
import dynamic from "next/dynamic"
import type { Movie } from "@/types"
import { ADMIN_MOVIES_LIMIT } from "@/lib/constants"

const MovieDialog = dynamic(
  () => import("@/components/movie-dialog").then((m) => ({ default: m.MovieDialog })),
  {
    loading: () => <Skeleton className="h-96 rounded-lg" />,
  }
)

export default function AdminMoviesPage() {
  const [publishedFilter, setPublishedFilter] = useState("all")

  const extraParams = useMemo(() => {
    if (publishedFilter === "all") return {} as Record<string, string>
    return { published: publishedFilter === "published" ? "true" : "false" }
  }, [publishedFilter])

  const {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    items: movies, total, totalPages,
    loading, isError, retry,
    goNext, goPrev, hasMore,
  } = useAdminListBase<Movie>({
    baseKey: queryKeys.adminMovies[0],
    queryFn: async ({ cursor, page, limit, search, sortBy, sortDir, extraParams }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set("cursor", String(cursor));
      else params.set("page", String(page));
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      for (const [key, val] of Object.entries(extraParams ?? {})) {
        if (val) params.set(key, val);
      }
      return adminApi.movies.search(params);
    },
    defaultLimit: ADMIN_MOVIES_LIMIT,
    extraParams,
  })

  const { deleteMutation, invalidateList } = useAdminEntityDelete({
    listKey: queryKeys.adminMovies[0],
    context: "admin-movies",
    deleteFn: adminApi.movies.delete,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function openCreateDialog() {
    setEditingMovie(null)
    setDialogOpen(true)
  }

  const openEditDialog = useCallback((movie: Movie) => {
    setEditingMovie(movie)
    setDialogOpen(true)
  }, [])

  const handleDeleteTarget = useCallback((movie: Movie) => {
    setDeleteTarget(movie)
    setDeleteDialogOpen(true)
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteDialogOpen(false)
    } catch (err) {
      logger.error("admin-movies", "Delete failed", err)
    }
  }

  const editInitialData = useMemo(() => editingMovie ? toMovieFormData(editingMovie) : undefined, [editingMovie])

  const limit = ADMIN_MOVIES_LIMIT;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Movies</h1>
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
            <TabsRoot value={publishedFilter} onValueChange={(v: string) => { setPublishedFilter(v); setPage(1) }}>
              <TabsList>
                <TabsTab value="all">All</TabsTab>
                <TabsTab value="draft">Draft</TabsTab>
                <TabsTab value="published">Published</TabsTab>
              </TabsList>
            </TabsRoot>
            <div className="flex items-center justify-between">
              <CardTitle>All Movies</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search by title..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load titles." onRetry={retry} className="py-8" />
          ) : (
            <MoviesTable movies={movies} loading={loading} sorting={sorting} onSortingChange={setSorting} onEdit={openEditDialog} onDelete={handleDeleteTarget} />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount page={page} limit={limit} total={total} />} goNext={goNext} goPrev={goPrev} hasMore={hasMore} />
    </div>
  )
}
