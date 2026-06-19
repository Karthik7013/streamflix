"use client"

import { useEffect, useState, useRef, useMemo, memo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"

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

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  if (total > 1) pages.push(total)
  return pages
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(timerRef.current)
  }, [local, onChange])

  return (
    <div className="relative w-64">
      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  )
}

const TagRow = memo(function TagRow({
  tag,
  editingId,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  deleteTarget,
  onDeleteTargetChange,
  onDelete,
  editInputRef,
  disabled,
}: {
  tag: Tag
  editingId: number | null
  editingName: string
  onEditingNameChange: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEdit: (tag: Tag) => void
  deleteTarget: Tag | null
  onDeleteTargetChange: (tag: Tag | null) => void
  onDelete: () => void
  editInputRef: { readonly current: HTMLInputElement | null }
  disabled: boolean
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        {editingId === tag.id ? (
          <div className="flex items-center gap-2">
            <Input
              ref={editInputRef}
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="h-8 max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit()
                if (e.key === "Escape") onCancelEdit()
              }}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSaveEdit}
              disabled={!editingName.trim()}
            >
              <CheckIcon className="size-3.5" />
              <span className="sr-only">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCancelEdit}
            >
              <XIcon className="size-3.5" />
              <span className="sr-only">Cancel</span>
            </Button>
          </div>
        ) : (
          <span className="font-medium">{tag.name}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary">{tag.movieCount ?? 0}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(tag)}
            disabled={disabled}
          >
            <PencilIcon className="size-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger onClick={() => onDeleteTargetChange(tag)}>
              <Trash2Icon className="size-3.5" />
              <span className="sr-only">Delete</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-2 mt-6">
                <AlertDialogClose
                  render={<Button variant="outline">Cancel</Button>}
                  onClick={() => onDeleteTargetChange(null)}
                />
                <Button
                  variant="destructive"
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  )
})

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const [creating, setCreating] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tags", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
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
        return {
          ...old,
          tags: [...old.tags, { id: -Date.now(), name, createdAt: new Date().toISOString(), movieCount: 0 }],
          total: old.total + 1,
        }
      })
      return { previous }
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-tags", page, search], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Update failed")
    },
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData<PaginatedResponse>(["admin-tags", page, search])
      queryClient.setQueryData<PaginatedResponse>(["admin-tags", page, search], (old) => {
        if (!old) return old
        return {
          ...old,
          tags: old.tags.map((t) => (t.id === id ? { ...t, name } : t)),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-tags", page, search], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-tags", page, search] })
      const previous = queryClient.getQueryData<PaginatedResponse>(["admin-tags", page, search])
      queryClient.setQueryData<PaginatedResponse>(["admin-tags", page, search], (old) => {
        if (!old) return old
        return {
          ...old,
          tags: old.tags.filter((t) => t.id !== id),
          total: old.total - 1,
        }
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-tags", page, search], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] })
    },
  })

  useEffect(() => {
    queueMicrotask(() => setPage(1))
  }, [search])

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
  }

  function cancelCreate() {
    setCreating(false)
    setNewTagName("")
  }

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
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName("")
  }

  function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    deleteMutation.mutate(id)
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content tags.
          </p>
        </div>
        <Button onClick={startCreate} disabled={creating}>
          <PlusIcon className="size-4" />
          Add Tag
        </Button>
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0 max-h-125">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tags</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12 shrink-0" />
                  <div className="flex-1" />
                  <Skeleton className="size-8 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No tags found.
            </div>
          ) : (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Movie Count</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creating && (
                    <tr className="border-b bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            ref={newInputRef}
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name..."
                            className="h-8 max-w-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreate()
                              if (e.key === "Escape") cancelCreate()
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleCreate}
                            disabled={!newTagName.trim()}
                          >
                            <CheckIcon className="size-3.5" />
                            <span className="sr-only">Save</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={cancelCreate}
                          >
                            <XIcon className="size-3.5" />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        —
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  )}
                  {tags.map((tag) => (
                    <TagRow
                      key={tag.id}
                      tag={tag}
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
            Showing {startItem}–{endItem} of {total} tags
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
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-1">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
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
