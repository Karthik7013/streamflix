"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
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
export interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [title, setTitle] = useState(editingEpisode?.title || "")
  const [slug, setSlugState] = useState(editingEpisode?.slug || "")
  const [episodeNumber, setEpisodeNumber] = useState(editingEpisode?.episodeNumber?.toString() || "")
  const [description, setDescription] = useState(editingEpisode?.description || "")
  const [videoUrl, setVideoUrl] = useState(editingEpisode?.videoUrl || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(editingEpisode?.thumbnailUrl || "")
  const [backdropUrl, setBackdropUrl] = useState(editingEpisode?.backdropUrl || "")
  const [durationSeconds, setDurationSeconds] = useState(editingEpisode?.durationSeconds?.toString() || "")
  const [releaseDate, setReleaseDate] = useState(editingEpisode?.releaseDate || "")

  function reset() {
    setTitle(editingEpisode?.title || "")
    setSlugState(editingEpisode?.slug || "")
    setEpisodeNumber(editingEpisode?.episodeNumber?.toString() || "")
    setDescription(editingEpisode?.description || "")
    setVideoUrl(editingEpisode?.videoUrl || "")
    setThumbnailUrl(editingEpisode?.thumbnailUrl || "")
    setBackdropUrl(editingEpisode?.backdropUrl || "")
    setDurationSeconds(editingEpisode?.durationSeconds?.toString() || "")
    setReleaseDate(editingEpisode?.releaseDate || "")
    setSlugManuallyEdited(!!editingEpisode?.slug)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEpisode ? "Edit Episode" : "Add Episode"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Episode Number</label>
            <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} placeholder="Auto if empty" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => {
              setTitle(e.target.value)
              if (!slugManuallyEdited) setSlugState(generateSlug(e.target.value))
            }} placeholder="Episode title" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug *</label>
            <Input value={slug} onChange={(e) => { setSlugManuallyEdited(true); setSlugState(e.target.value) }} placeholder="episode-slug" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" placeholder="Episode description" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Video URL</label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <UploadField label="Thumbnail" folder="thumbnails" value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>
            <div className="space-y-1.5">
              <UploadField label="Backdrop" folder="backdrops" value={backdropUrl} onChange={setBackdropUrl} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} placeholder="3600" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Release Date</label>
              <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({
            title,
            slug,
            episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
            description: description || null,
            videoUrl: videoUrl || null,
            thumbnailUrl: thumbnailUrl || null,
            backdropUrl: backdropUrl || null,
            durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
            releaseDate: releaseDate || null,
          })} disabled={saving || !title || !slug}>
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {editingEpisode ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
