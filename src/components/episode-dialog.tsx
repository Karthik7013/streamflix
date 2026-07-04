"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadField } from "@/components/upload-field";
import { generateSlug } from "@/lib/validation";
import type { Episode } from "@/types";

interface EpisodeFormData {
  title: string;
  slug: string;
  episodeNumber: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  backdropUrl: string;
  durationSeconds: string;
  releaseDate: string;
}

export function EpisodeDialog({
  open, onOpenChange, editingEpisode, onSave, saving,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingEpisode: Episode | null
  onSave: (data: any) => void
  saving: boolean
}) {
  const slugManuallyEdited = useRef(false);

  const defaultValues: EpisodeFormData = {
    title: editingEpisode?.title || "",
    slug: editingEpisode?.slug || "",
    episodeNumber: editingEpisode?.episodeNumber?.toString() || "",
    description: editingEpisode?.description || "",
    videoUrl: editingEpisode?.videoUrl || "",
    thumbnailUrl: editingEpisode?.thumbnailUrl || "",
    backdropUrl: editingEpisode?.backdropUrl || "",
    durationSeconds: editingEpisode?.durationSeconds?.toString() || "",
    releaseDate: editingEpisode?.releaseDate || "",
  };

  const { register, handleSubmit, reset, watch, setValue } = useForm<EpisodeFormData>({ defaultValues });
  const watchTitle = watch("title");

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setValue("slug", generateSlug(watchTitle));
    }
  }, [watchTitle, setValue]);

  useEffect(() => {
    slugManuallyEdited.current = !!editingEpisode?.slug;
  }, [editingEpisode]);

  useEffect(() => {
    reset(defaultValues);
  }, [editingEpisode]);

  function onSubmit(data: EpisodeFormData) {
    onSave({
      title: data.title,
      slug: data.slug,
      episodeNumber: data.episodeNumber ? parseInt(data.episodeNumber) : undefined,
      description: data.description || null,
      videoUrl: data.videoUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      backdropUrl: data.backdropUrl || null,
      durationSeconds: data.durationSeconds ? parseInt(data.durationSeconds) : null,
      releaseDate: data.releaseDate || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(defaultValues); onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEpisode ? "Edit Episode" : "Add Episode"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Episode Number</label>
              <Input type="number" {...register("episodeNumber")} placeholder="Auto if empty" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title *</label>
              <Input {...register("title", { required: true })} placeholder="Episode title" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug *</label>
              <Input {...register("slug", { required: true, onChange: () => { slugManuallyEdited.current = true } })} placeholder="episode-slug" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...register("description")} className="min-h-16" placeholder="Episode description" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Video URL</label>
              <Input {...register("videoUrl")} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <UploadField label="Thumbnail" folder="thumbnails" value={watch("thumbnailUrl")} onChange={(v) => setValue("thumbnailUrl", v)} />
              </div>
              <div className="space-y-1.5">
                <UploadField label="Backdrop" folder="backdrops" value={watch("backdropUrl")} onChange={(v) => setValue("backdropUrl", v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Input type="number" {...register("durationSeconds")} placeholder="3600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Release Date</label>
                <Input type="date" {...register("releaseDate")} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              {editingEpisode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
