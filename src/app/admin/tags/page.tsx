"use client"

import { useEffect, useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import { type SortingState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { STALE } from "@/lib/stale-times"
import { adminApi } from "@/lib/api/admin"
import type { Tag } from "@/types"
import SearchInput from "@/app/admin/search-input"
import Pagination from "@/app/admin/pagination"
import { ItemCount } from "@/components/item-count"
import { CreateTagForm } from "@/app/admin/tags/create-tag-form"
import TagsTable from "@/app/admin/tags-table"

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

  const tags = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.tags.create(name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData(["admin-tags", page, search]) as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
      queryClient.setQueryData(["admin-tags", page, search], (old: unknown) => {
        const o = old as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
        if (!o) return o
        return { ...o, data: [...o.data, { id: -Date.now(), name, createdAt: new Date().toISOString(), movieCount: 0 } as Tag], meta: { ...o.meta, total: o.meta.total + 1 } }
      })
      return { previous }
    },
    onError: (_err, _name, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => adminApi.tags.update(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData(["admin-tags", page, search]) as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
      queryClient.setQueryData(["admin-tags", page, search], (old: unknown) => {
        const o = old as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
        if (!o) return o
        return { ...o, data: o.data.map((t) => (t.id === id ? { ...t, name } : t)) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.tags.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData(["admin-tags", page, search]) as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
      queryClient.setQueryData(["admin-tags", page, search], (old: unknown) => {
        const o = old as { data: Tag[]; meta: { total: number; totalPages: number } } | undefined
        if (!o) return o
        return { ...o, data: o.data.filter((t) => t.id !== id), meta: { ...o.meta, total: o.meta.total - 1 } }
      })
      return { previous }
    },
    onError: (_err, _id, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  useEffect(() => { queueMicrotask(() => setPage(1)) }, [search])

  function handleCreate(name: string) {
    setCreating(false)
    createMutation.mutate(name)
    toast.success("Tag created.")
  }

  function cancelCreate() { setCreating(false) }

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setEditingName(tag.name)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  function handleSaveEdit() {
    const name = editingName.trim()
    if (!name || editingId === null) return
    const id = editingId
    setEditingId(null)
    setEditingName("")
    editMutation.mutate({ id, name })
    toast.success("Tag updated.")
  }

  function cancelEdit() { setEditingId(null); setEditingName("") }

  function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    deleteMutation.mutate(id)
    toast.success("Tag deleted.")
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

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Tags</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {creating && <CreateTagForm onCreate={handleCreate} onCancel={cancelCreate} />}
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
            deleteTarget={deleteTarget}
            onDeleteTargetChange={setDeleteTarget}
            onDelete={handleDelete}
            editInputRef={editInputRef}
            disabled={editingId !== null}
          />
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
