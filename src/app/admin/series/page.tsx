"use client";

import { useState, useMemo } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { useAdminCrud } from "@/hooks/use-admin-crud"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { SeriesTable } from "@/app/admin/series-table"
import { ItemCount } from "@/components/item-count"
import { Tabs as TabsRoot, TabsList, TabsTrigger as TabsTab } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

const SeriesDialog = dynamic(
  () => import("@/app/admin/series-dialog").then((m) => ({ default: m.SeriesDialog })),
  {
    loading: () => <Skeleton className="h-96 rounded-lg" />,
  }
)

interface SerializedSeries {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string
  backdropUrl: string | null
  trailerUrl: string | null
  releaseDate: string | null
  tmdbId: number | null
  originalLanguage: string | null
  tags: { id: number; name: string }[]
  seasonCount?: number
  published: boolean
}

export default function AdminSeriesPage() {
  const [publishedFilter, setPublishedFilter] = useState("all")

  const extraParams = useMemo(() => {
    if (publishedFilter === "all") return {} as Record<string, string>
    return { published: publishedFilter === "published" ? "true" : "false" }
  }, [publishedFilter])

  const {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    items: seriesList, total, totalPages,
    isLoading, isError, refetch,
    deleteMutation, invalidateList,
  } = useAdminCrud<SerializedSeries>({ baseKey: "admin-series", endpoint: "/api/admin/series", defaultLimit: 50, extraParams })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<SerializedSeries | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SerializedSeries | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function openCreateDialog() {
    setEditingSeries(null)
    setDialogOpen(true)
  }

  function openEditDialog(s: SerializedSeries) {
    setEditingSeries(s)
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

  const editInitialData = useMemo(() => editingSeries ? {
    title: editingSeries.title,
    slug: editingSeries.slug,
    description: editingSeries.description ?? "",
    thumbnailUrl: editingSeries.thumbnailUrl ?? "",
    backdropUrl: editingSeries.backdropUrl ?? "",
    trailerUrl: editingSeries.trailerUrl ?? "",
    releaseDate: editingSeries.releaseDate ?? "",
    tagIds: editingSeries.tags.map((t) => t.id),
    tmdbId: editingSeries.tmdbId ?? undefined,
    originalLanguage: editingSeries.originalLanguage ?? "",
    published: editingSeries.published ?? false,
  } : undefined, [editingSeries])

  const limit = 50
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Series</h1>
          <p className="text-muted-foreground mt-1">Manage your web series catalog.</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto shrink-0">
          <PlusIcon className="size-4" />
          Add Series
        </Button>
      </div>

      {dialogOpen && (
        <SeriesDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialData={editingSeries ? editInitialData : undefined}
          editSeriesId={editingSeries?.id}
          onSuccess={invalidateList}
        />
      )}

      <DeleteEntityDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null) }}
        entityLabel="Series"
        entityName={deleteTarget?.title ?? null}
        extraWarning="This will also delete all seasons and episodes."
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex flex-col gap-3">
            <TabsRoot value={publishedFilter} onValueChange={(v: string) => { setPublishedFilter(v); setPage(1) }}>
              <TabsList>
                <TabsTab value="all">Full</TabsTab>
                <TabsTab value="draft">Draft</TabsTab>
                <TabsTab value="published">Published</TabsTab>
              </TabsList>
            </TabsRoot>
            <div className="flex items-center justify-between">
              <CardTitle>All Series</CardTitle>
              <SearchInput value={search} onChange={setSearch} placeholder="Search by title..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load series." onRetry={refetch} className="py-8" />
          ) : (
            <SeriesTable series={seriesList} loading={isLoading} sorting={sorting} onSortingChange={setSorting} onEdit={openEditDialog} onDelete={(s) => { setDeleteTarget(s); setDeleteDialogOpen(true) }} />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
