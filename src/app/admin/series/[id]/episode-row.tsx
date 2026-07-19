"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import type { Episode } from "@/types";

interface EpisodeRowProps {
  episode: Episode;
  onEdit: (episode: Episode) => void;
  onDelete: (episodeId: number) => void;
}

export function EpisodeRow({ episode, onEdit, onDelete }: EpisodeRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-muted-foreground w-8 shrink-0">
          {episode.episodeNumber}.
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{episode.title}</p>
          <p className="text-xs text-muted-foreground">
            {episode.durationSeconds ? formatDuration(episode.durationSeconds) : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(episode)}>
          <PencilIcon className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-7 text-rose-500"><Trash2Icon className="size-3.5" /></Button>} />
          <AlertDialogContent>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {'\u201C'}{episode.title}{'\u201D'}? This cannot be undone.
            </AlertDialogDescription>
            <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
            <AlertDialogClose render={<Button variant="destructive" onClick={() => onDelete(episode.id)}>Delete</Button>} />
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
