"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { SearchIcon, PlusIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
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

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const newInputRef = useRef<HTMLInputElement>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const snapshotRef = useRef<Tag[] | null>(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const res = await fetch(`/api/admin/tags?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: PaginatedResponse = await res.json()
      setTags(data.tags)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  function startCreate() {
    setCreating(true)
    setNewTagName("")
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  async function handleCreate() {
    const name = newTagName.trim()
    if (!name) return
    snapshotRef.current = [...tags]
    const optimistic: Tag = { id: -Date.now(), name, createdAt: new Date().toISOString(), movieCount: 0 }
    setTags((prev) => [...prev, optimistic])
    setCreating(false)
    setNewTagName("")
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Create failed")
      fetchTags()
    } catch {
      if (snapshotRef.current) setTags(snapshotRef.current)
    }
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

  async function handleSaveEdit() {
    const name = editingName.trim()
    if (!name || editingId === null) return
    snapshotRef.current = [...tags]
    setTags((prev) => prev.map((t) => (t.id === editingId ? { ...t, name } : t)))
    setEditingId(null)
    setEditingName("")
    try {
      const res = await fetch(`/api/admin/tags/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Update failed")
      fetchTags()
    } catch {
      if (snapshotRef.current) setTags(snapshotRef.current)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName("")
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    snapshotRef.current = [...tags]
    setTags((prev) => prev.filter((t) => t.id !== targetId))
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/admin/tags/${targetId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      fetchTags()
    } catch {
      if (snapshotRef.current) setTags(snapshotRef.current)
    }
  }

  const limit = 50
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
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

      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tags</CardTitle>
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
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
                    <tr key={tag.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        {editingId === tag.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              ref={editInputRef}
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 max-w-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") cancelEdit()
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={handleSaveEdit}
                              disabled={!editingName.trim()}
                            >
                              <CheckIcon className="size-3.5" />
                              <span className="sr-only">Save</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={cancelEdit}
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
                            onClick={() => startEdit(tag)}
                            disabled={editingId !== null}
                          >
                            <PencilIcon className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger onClick={() => setDeleteTarget(tag)}>
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
                                  onClick={() => setDeleteTarget(null)}
                                />
                                <Button
                                  variant="destructive"
                                  onClick={handleDelete}
                                >
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
