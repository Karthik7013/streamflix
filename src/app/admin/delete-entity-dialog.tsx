"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2Icon } from "lucide-react";

export function DeleteEntityDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName,
  extraWarning,
  onDelete,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Movie", "Series" — used for the dialog title */
  entityLabel: string;
  entityName: string | null;
  /** Optional extra sentence inserted before "This action cannot be undone.", e.g. for cascading deletes */
  extraWarning?: string;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Delete {entityLabel}</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <strong>{entityName}</strong>?{" "}
          {extraWarning ? `${extraWarning} ` : ""}This action cannot be undone.
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
