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
  DialogDescription,
} from "@/components/ui/dialog";

interface ImportSeasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesTmdbId: number | null | undefined;
  onImport: (seasonNumber: number, tmdbId?: number) => void;
  isPending: boolean;
}

export function ImportSeasonDialog({ open, onOpenChange, seriesTmdbId, onImport, isPending }: ImportSeasonDialogProps) {
  const [seasonNum, setSeasonNum] = useState("");
  const [tmdbId, setTmdbId] = useState("");

  function handleOpenChange(o: boolean) {
    if (!o) { setSeasonNum(""); setTmdbId("") }
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Season from TMDB</DialogTitle>
          <DialogDescription>
            This will create a new season with all episodes from TMDB.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!seriesTmdbId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">TMDB TV Show ID</label>
              <Input type="number" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} placeholder="e.g. 1399 (Game of Thrones)" min={1} />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Season Number</label>
            <Input type="number" value={seasonNum} onChange={(e) => setSeasonNum(e.target.value)} placeholder="e.g. 1" min={1} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onImport(parseInt(seasonNum), tmdbId ? parseInt(tmdbId) : undefined)} disabled={!seasonNum || isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
