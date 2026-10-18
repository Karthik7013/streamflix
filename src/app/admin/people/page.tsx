"use client"

import { useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { ItemCount } from "@/components/feedback/item-count"
import { ErrorState } from "@/components/feedback/error-state"
import { DeleteEntityDialog } from "@/app/admin/delete-entity-dialog"
import { CreatePersonForm } from "@/app/admin/people/create-person-form"
import { PeopleTable } from "@/app/admin/people-table"
import { useAdminPeoplePage } from "@/hooks/people"
import type { Person } from "@/types"

export default function AdminPeoplePage() {
  const {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    creating, setCreating,
    editingId, editingName, setEditingName,
    editingTmdbId, setEditingTmdbId,
    editingProfileUrl, setEditingProfileUrl,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    people, total, totalPages, limit,
    loading, isError, retry,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  } = useAdminPeoplePage()

  const handleDeleteTarget = useCallback((person: Person) => { setDeleteTarget(person); setDeleteDialogOpen(true) }, [setDeleteTarget, setDeleteDialogOpen])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">People</h1>
          <p className="text-muted-foreground mt-1">Manage cast and crew.</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <PlusIcon className="size-4" /> Add Person
        </Button>
      </div>

      <DeleteEntityDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null) }}
        entityLabel="Person"
        entityName={deleteTarget?.name ?? null}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>All People</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message="Unable to load people." onRetry={retry} className="py-8" />
          ) : (
            <>
              {creating && <CreatePersonForm onCreate={handleCreate} onCancel={cancelCreate} isPending={createMutation.isPending} />}
              <PeopleTable
                people={people}
                loading={loading}
                sorting={sorting}
                onSortingChange={setSorting}
                editingId={editingId}
                editingName={editingName}
                onEditingNameChange={setEditingName}
                editingTmdbId={editingTmdbId}
                onEditingTmdbIdChange={setEditingTmdbId}
                editingProfileUrl={editingProfileUrl}
                onEditingProfileUrlChange={setEditingProfileUrl}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={cancelEdit}
                onEdit={startEdit}
                onDelete={handleDeleteTarget}
                editInputRef={editInputRef}
                disabled={editingId !== null}
                isEditing={editMutation.isPending}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount page={page} limit={limit} total={total} />} />
    </div>
  )
}
