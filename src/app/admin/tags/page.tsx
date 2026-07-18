"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import { type SortingState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { STALE } from "@/lib/stale-times"
import { adminApi } from "@/lib/api/admin"
import { logger } from "@/lib/logger"
import type { Tag } from "@/types"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { ItemCount } from "@/components/item-count"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { CreateTagForm } from "@/app/admin/tags/create-tag-form"
import { TagsTable } from "@/app/admin/tags-table"

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const limit = 50

  const sortBy = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? "desc" : "asc"

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tags", page, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      if (sortBy) params.set("sortBy", sortBy)
      if (sortDir) params.set("sortDir", sortDir)
      return adminApi.tags.list(params)
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  })

  const tags = useMemo(() => data?.data ?? [], [data?.data])
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total])
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 1, [data?.meta?.totalPages])

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.tags.create(name),
    onSuccess: () => { toast.success("Tag created.") },
    onError: (err) => { logger.error("tags", "Failed to create tag", err); toast.error("Unable to create tag.") },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => adminApi.tags.update(id, name),
    onSuccess: () => { toast.success("Tag updated.") },
    onError: (err) => { logger.error("tags", "Failed to update tag", err); toast.error("Unable to update tag.") },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.tags.delete(id),
    onSuccess: () => { toast.success("Tag deleted.") },
    onError: (err) => { logger.error("tags", "Failed to delete tag", err); toast.error("Unable to delete tag.") },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  useEffect(() => { queueMicrotask(() => setPage(1)) }, [search])

  async function handleCreate(name: string) {
    try {
      await createMutation.mutateAsync(name)
      setCreating(false)
    } catch {
      // error toast handled by mutation's onError
    }
  }

  function cancelCreate() { setCreating(false) }

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setEditingName(tag.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  async function handleSaveEdit() {
    const name = editingName.trim()
    if (!name || editingId === null) return
    const id = editingId
    try {
      await editMutation.mutateAsync({ id, name })
      setEditingId(null)
      setEditingName("")
    } catch {
      // error toast handled by mutation's onError
    }
  }

  function cancelEdit() { setEditingId(null); setEditingName("") }

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

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-1">Manage your content tags.</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <PlusIcon className="size-4" /> Add Tag
        </Button>
      </div>

      <DeleteEntityDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null) }}
        entityLabel="Tag"
        entityName={deleteTarget?.name ?? null}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Tags</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {creating && <CreateTagForm onCreate={handleCreate} onCancel={cancelCreate} isPending={createMutation.isPending} />}
          <TagsTable
            tags={tags}
            loading={isLoading}
            sorting={sorting}
            onSortingChange={setSorting}
            editingId={editingId}
            editingName={editingName}
            onEditingNameChange={setEditingName}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={cancelEdit}
            onEdit={startEdit}
            onDelete={(tag) => { setDeleteTarget(tag); setDeleteDialogOpen(true) }}
            editInputRef={editInputRef}
            disabled={editingId !== null}
            isEditing={editMutation.isPending}
          />
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
