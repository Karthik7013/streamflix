"use client";

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
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
import { movieFormSchema, type MovieFormData } from "@/lib/schemas"

interface Tag {
  id: number
  name: string
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const prevOpen = useRef(open)
  const stagedUrls = useRef<Set<string>>(new Set())
  const initialUrls = useRef<Set<string>>(new Set())
  const justSaved = useRef(false)

  function deleteUploadedFile(url: string) {
    fetch(`/api/upload/file?url=${encodeURIComponent(url)}`, { method: "DELETE" }).catch(() => {})
  }

  function handleRemoveUpload(url: string) {
    if (stagedUrls.current.has(url)) {
      stagedUrls.current.delete(url)
      deleteUploadedFile(url)
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MovieFormData>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      backdropUrl: "",
      durationSeconds: "",
      releaseDate: "",
      tagIds: [],
    },
  })

  const title = watch("title")
  const slug = watch("slug")
  const year = (watch("releaseDate") ?? "").split("-")[0]

  const watchedTagIds = watch("tagIds")

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
    mutationFn: async (formData: MovieFormData) => {
      const body = {
        ...formData,
        durationSeconds: parseInt(formData.durationSeconds ?? "") || null,
        tagIds: formData.tagIds,
        releaseDate: formData.releaseDate || null,
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
      justSaved.current = true
      stagedUrls.current.clear()
      toast.success(editingMovie ? "Movie updated" : "Movie created")
      onOpenChange(false)
      onSuccess()
    },
    onError: () => {
      toast.error(editingMovie ? "Failed to update movie" : "Failed to create movie")
    },
  })

  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open

    if (justOpened) {
      stagedUrls.current = new Set()
      justSaved.current = false

      if (initialData) {
        initialUrls.current = new Set(
          [initialData.videoUrl, initialData.thumbnailUrl, initialData.backdropUrl].filter(Boolean) as string[]
        )
        reset({
          title: initialData.title ?? "",
          slug: initialData.slug ?? "",
          description: initialData.description ?? "",
          videoUrl: initialData.videoUrl ?? "",
          thumbnailUrl: initialData.thumbnailUrl ?? "",
          backdropUrl: initialData.backdropUrl ?? "",
          durationSeconds: initialData.durationSeconds ?? "",
          releaseDate: initialData.releaseDate ?? "",
          tagIds: initialData.tagIds ?? [],
        })
        setSlugManuallyEdited(!!initialData.slug)
        setEditingMovie(editMovieId ? { id: editMovieId } : null)
      } else {
        initialUrls.current = new Set()
        reset()
        setSlugManuallyEdited(false)
        setEditingMovie(null)
      }
    }
  }, [open, initialData, editMovieId, reset])

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      const generatedSlug = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", generatedSlug, { shouldValidate: false })
    }
  }, [title, slugManuallyEdited, setValue])

  function onSubmit(data: MovieFormData) {
    saveMovie(data)
  }

  function handleOpenChange(open: boolean) {
    if (!open && !justSaved.current) {
      for (const url of stagedUrls.current) {
        deleteUploadedFile(url)
      }
      stagedUrls.current.clear()
    }
    onOpenChange(open)
  }

  function handleUploadChange(field: "videoUrl" | "thumbnailUrl" | "backdropUrl", url: string) {
    if (url && !initialUrls.current.has(url)) {
      stagedUrls.current.add(url)
    }
    setValue(field, url)
  }

  function toggleTag(tagId: number) {
    const current = watchedTagIds
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
    setValue("tagIds", next, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingMovie ? "Edit Movie" : "Add Movie"}</DialogTitle>
          <DialogDescription>
            {editingMovie
              ? "Update the movie details below."
              : "Fill in the details to add a new movie."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  {...register("title")}
                  placeholder="Movie title"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  {...register("slug")}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setValue("slug", e.target.value, { shouldValidate: true })
                  }}
                  placeholder="movie-slug"
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register("description")}
                placeholder="Movie description"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <UploadField
                  accept="video/*"
                  label="Video"
                  folder="videos"
                  value={watch("videoUrl") ?? ""}
                  onChange={(url) => handleUploadChange("videoUrl", url)}
                  onRemove={handleRemoveUpload}
                />
              </div>
              <div className="space-y-1.5">
                <UploadField
                  label="Thumbnail"
                  folder="thumbnails"
                  value={watch("thumbnailUrl") ?? ""}
                  onChange={(url) => handleUploadChange("thumbnailUrl", url)}
                  onRemove={handleRemoveUpload}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <UploadField
                label="Backdrop"
                folder="backdrops"
                value={watch("backdropUrl") ?? ""}
                onChange={(url) => handleUploadChange("backdropUrl", url)}
                onRemove={handleRemoveUpload}
              />
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Input
                  type="number"
                  {...register("durationSeconds")}
                  placeholder="3600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Release Date</label>
                <Input
                  type="date"
                  {...register("releaseDate")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <UploadField
                  accept="video/*"
                  label="Video"
                  folder="videos"
                  value={watch("videoUrl") ?? ""}
                  onChange={(url) => setValue("videoUrl", url)}
                />
              </div>
              <div className="space-y-1.5">
                <UploadField
                  label="Thumbnail"
                  folder={`movies/${year}/${slug}/thumbnails`}
                  value={watch("thumbnailUrl") ?? ""}
                  onChange={(url) => setValue("thumbnailUrl", url)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <UploadField
                label="Backdrop"
                folder={`movies/${year}/${slug}/backdrops`}
                value={watch("backdropUrl") ?? ""}
                onChange={(url) => setValue("backdropUrl", url)}
              />
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
                      watchedTagIds.includes(tag.id)
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
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              {editingMovie ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
