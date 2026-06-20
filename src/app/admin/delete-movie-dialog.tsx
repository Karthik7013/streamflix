"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2Icon } from "lucide-react";

export default function DeleteMovieDialog({
  open,
  onOpenChange,
  movieTitle,
  onDelete,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieTitle: string | null;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Delete Movie</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{movieTitle}</strong>?
          This action cannot be undone.
        </DialogDescription>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onDelete} disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
