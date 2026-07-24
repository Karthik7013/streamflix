"use client"

import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { ItemCount } from "@/components/item-count"
import { ErrorState } from "@/components/error-state"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { CreateTagForm } from "@/app/admin/tags/create-tag-form"
import { TagsTable } from "@/app/admin/tags-table"
import { useAdminTagsPage } from "@/hooks/use-admin-tags-page"

export default function AdminTagsPage() {
  const {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    creating, setCreating,
    editingId, editingName, setEditingName,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    tags, total, totalPages, limit,
    loading, isError, retry,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  } = useAdminTagsPage()

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
          {isError ? (
            <ErrorState message="Unable to load tags." onRetry={retry} className="py-8" />
          ) : (
            <>
              {creating && <CreateTagForm onCreate={handleCreate} onCancel={cancelCreate} isPending={createMutation.isPending} />}
              <TagsTable
                tags={tags}
                loading={loading}
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
            </>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
