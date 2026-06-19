"use client";

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { UploadField } from "@/components/upload-field"

interface Tag {
  id: number
  name: string
}

interface MovieFormData {
  title: string
  slug: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  backdropUrl: string
  durationSeconds: string
  releaseDate: string
  tagIds: number[]
}

const emptyForm: MovieFormData = {
  title: "",
  slug: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  backdropUrl: "",
  durationSeconds: "",
  releaseDate: "",
  tagIds: [],
}

interface MovieDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<MovieFormData>
  editMovieId?: number
  onSuccess: () => void
}

export function MovieDialog({ open, onOpenChange, initialData, editMovieId, onSuccess }: MovieDialogProps) {
  const [editingMovie, setEditingMovie] = useState<{ id: number } | null>(null)
  const [form, setForm] = useState<MovieFormData>(emptyForm)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const prevOpen = useRef(open)

  const { data: allTags } = useQuery<Tag[]>({
    queryKey: ["admin-tags-select"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tags?limit=100")
      if (!res.ok) throw new Error("Failed to fetch tags")
      const data = await res.json()
      return data.tags ?? []
    },
    enabled: open,
  })

  const { mutate: saveMovie, isPending: saving } = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        durationSeconds: parseInt(form.durationSeconds) || null,
        tagIds: form.tagIds,
        releaseDate: form.releaseDate || null,
      }

      if (editingMovie) {
        const res = await fetch(`/api/admin/movies/${editingMovie.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch("/api/admin/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      onOpenChange(false)
      onSuccess()
    },
  })

  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open

    if (justOpened) {
      if (initialData) {
        queueMicrotask(() => setForm({
          title: initialData.title ?? "",
          slug: initialData.slug ?? "",
          description: initialData.description ?? "",
          videoUrl: initialData.videoUrl ?? "",
          thumbnailUrl: initialData.thumbnailUrl ?? "",
          backdropUrl: initialData.backdropUrl ?? "",
          durationSeconds: initialData.durationSeconds ?? "",
          releaseDate: initialData.releaseDate ?? "",
          tagIds: initialData.tagIds ?? [],
        }))
        queueMicrotask(() => setSlugManuallyEdited(!!initialData.slug))
        queueMicrotask(() => setEditingMovie(editMovieId ? { id: editMovieId } : null))
      } else {
        queueMicrotask(() => setForm(emptyForm))
        queueMicrotask(() => setSlugManuallyEdited(false))
        queueMicrotask(() => setEditingMovie(null))
      }
    }
  }, [open, initialData, editMovieId])

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited
        ? prev.slug
        : title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }))
  }

  function toggleTag(tagId: number) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingMovie ? "Edit Movie" : "Add Movie"}</DialogTitle>
          <DialogDescription>
            {editingMovie
              ? "Update the movie details below."
              : "Fill in the details to add a new movie."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Movie title"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
                placeholder="movie-slug"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Movie description"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <UploadField
                accept="*/*"
                label="Video"
                folder="videos"
                value={form.videoUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, videoUrl: url }))}
              />
            </div>
            <div className="space-y-1.5">
              <UploadField
                label="Thumbnail"
                folder="thumbnails"
                value={form.thumbnailUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, thumbnailUrl: url }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <UploadField
              label="Backdrop"
              folder="backdrops"
              value={form.backdropUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, backdropUrl: url }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input
                type="number"
                value={form.durationSeconds}
                onChange={(e) => setForm((prev) => ({ ...prev, durationSeconds: e.target.value }))}
                placeholder="3600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Release Date</label>
              <Input
                type="date"
                value={form.releaseDate}
                onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags?.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors",
                    form.tagIds.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {tag.name}
                </button>
              ))}
              {allTags?.length === 0 && (
                <span className="text-sm text-muted-foreground">No tags available.</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMovie()} disabled={saving}>
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {editingMovie ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
