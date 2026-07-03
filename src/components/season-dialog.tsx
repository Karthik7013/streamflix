"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export interface Season {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  episodeCount?: number;
}

export function SeasonDialog({
  open, onOpenChange, editingSeason, onSave, saving,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingSeason: Season | null
  onSave: (data: { seasonNumber?: number; title?: string }) => void
  saving: boolean
}) {
  const [seasonNumber, setSeasonNumber] = useState(editingSeason?.seasonNumber?.toString() || "")
  const [title, setTitle] = useState(editingSeason?.title || "")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSeasonNumber(""); setTitle("") }; onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSeason ? "Edit Season" : "Add Season"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Season Number</label>
            <Input type="number" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} placeholder="Auto if empty" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title (optional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Season 1: Origins" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({
            seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
            title: title || undefined,
          })} disabled={saving}>
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {editingSeason ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
