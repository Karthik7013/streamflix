"use client"

import { useEffect, useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PlusIcon, CheckIcon, XIcon } from "lucide-react"
import { type SortingState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import SearchInput from "../search-input"
import Pagination from "../pagination"
import TagsTable from "../tags-table"

interface Tag {
  id: number
  name: string
  createdAt: string
  movieCount?: number
}

interface PaginatedResponse {
  tags: Tag[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])

  const [creating, setCreating] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)

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
      const res = await fetch(`/api/admin/tags?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json() as Promise<PaginatedResponse>
    },
  })

  const tags = data?.tags ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Create failed")
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData<PaginatedResponse>(["admin-tags", page, search])
      queryClient.setQueryData<PaginatedResponse>(["admin-tags", page, search], (old) => {
        if (!old) return old
        return { ...old, tags: [...old.tags, { id: -Date.now(), name, createdAt: new Date().toISOString(), movieCount: 0 }], total: old.total + 1 }
      })
      return { previous }
    },
    onError: (_err, _name, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const editMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
      if (!res.ok) throw new Error("Update failed")
    },
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData<PaginatedResponse>(["admin-tags", page, search])
      queryClient.setQueryData<PaginatedResponse>(["admin-tags", page, search], (old) => {
        if (!old) return old
        return { ...old, tags: old.tags.map((t) => (t.id === id ? { ...t, name } : t)) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData<PaginatedResponse>(["admin-tags", page, search])
      queryClient.setQueryData<PaginatedResponse>(["admin-tags", page, search], (old) => {
        if (!old) return old
        return { ...old, tags: old.tags.filter((t) => t.id !== id), total: old.total - 1 }
      })
      return { previous }
    },
    onError: (_err, _id, context) => { if (context?.previous) queryClient.setQueryData(["admin-tags", page, search], context.previous) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-tags"] }) },
  })

  useEffect(() => { queueMicrotask(() => setPage(1)) }, [search])

  function startCreate() {
    setCreating(true)
    setNewTagName("")
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  function handleCreate() {
    const name = newTagName.trim()
    if (!name) return
    setCreating(false)
    setNewTagName("")
    createMutation.mutate(name)
    toast.success("Tag created")
  }

  function cancelCreate() { setCreating(false); setNewTagName("") }

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
    toast.success("Tag updated")
  }

  function cancelEdit() { setEditingId(null); setEditingName("") }

  function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    deleteMutation.mutate(id)
    toast.success("Tag deleted")
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
        <Button onClick={startCreate} disabled={creating}>
          <PlusIcon className="size-4" /> Add Tag
        </Button>
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0 max-h-125">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tags</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
          </div>
        </CardHeader>
        <div className="p-0 overflow-auto flex-1 min-h-0">
          {creating && (
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <Input
                ref={newInputRef as React.Ref<HTMLInputElement>}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name..."
                className="h-8 max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") cancelCreate();
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCreate}
                disabled={!newTagName.trim()}
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={cancelCreate}>
                <XIcon className="size-3.5" />
              </Button>
            </div>
          )}
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
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={`Showing ${startItem}–${endItem} of ${total} tags`} />
    </div>
  )
}
