"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Check, Loader2Icon } from "lucide-react";
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
  durationSeconds: string;
  releaseDate: string;
}

export function EpisodeDialog({
  open, onOpenChange, editingEpisode, onSave, saving, seriesSlug,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingEpisode: Episode | null
  onSave: (data: Record<string, unknown>) => void
  saving: boolean
  seriesSlug?: string
}) {
  const slugManuallyEdited = useRef(false);
  const [copied, setCopied] = useState(false);

  const defaultValues = useMemo((): EpisodeFormData => ({
    title: editingEpisode?.title || "",
    slug: editingEpisode?.slug || "",
    episodeNumber: editingEpisode?.episodeNumber?.toString() || "",
    description: editingEpisode?.description || "",
    videoUrl: editingEpisode?.videoUrl || "",
    thumbnailUrl: editingEpisode?.thumbnailUrl || "",
    durationSeconds: editingEpisode?.durationSeconds?.toString() || "",
    releaseDate: editingEpisode?.releaseDate || "",
  }), [editingEpisode]);

  const { register, handleSubmit, reset, watch, setValue } = useForm<EpisodeFormData>({ defaultValues });
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchTitle = watch("title");
  const watchEpNum = watch("episodeNumber");
  const watchVideoUrl = watch("videoUrl");

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
  }, [editingEpisode, defaultValues, reset]);

  function computeUploadKey(suffix: string) {
    if (!seriesSlug || !watchEpNum) return undefined;
    return `series/${seriesSlug}/season-${editingEpisode ? editingEpisode.seasonId : "{seasonId}"}/episode-${watchEpNum}/${suffix}`;
  }

  const videoUploadKey = computeUploadKey("videos/video.mp4");
  const thumbnailUploadKey = computeUploadKey("thumbnails/01.jpg");

  function handleCopy() {
    if (videoUploadKey) {
      navigator.clipboard.writeText(videoUploadKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function onSubmit(data: EpisodeFormData) {
    onSave({
      title: data.title,
      slug: data.slug,
      episodeNumber: data.episodeNumber ? parseInt(data.episodeNumber) : undefined,
      description: data.description || null,
      videoUrl: data.videoUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
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
            {videoUploadKey && !watchVideoUrl && (
              <div className="space-y-1.5 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Upload Key</p>
                  <button type="button" onClick={handleCopy} className="rounded p-1 transition-colors hover:bg-white/10">
                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{videoUploadKey}</code>
                </p>
              </div>
            )}
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
              <Input {...register("videoUrl")} placeholder="Leave empty to auto-compute" />
            </div>
            <div className="space-y-1.5">
              <UploadField label="Thumbnail" folder="thumbnails" uploadKey={thumbnailUploadKey} value={watch("thumbnailUrl")} onChange={(v) => setValue("thumbnailUrl", v)} />
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
