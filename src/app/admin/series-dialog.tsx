"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { seriesFormSchema, type SeriesFormData } from "@/lib/schemas";
import { EntityDialog } from "@/components/entity-dialog";

interface SeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<SeriesFormData>;
  editSeriesId?: number;
  onSuccess: () => void;
}

export function SeriesDialog({ open, onOpenChange, initialData, editSeriesId, onSuccess }: SeriesDialogProps) {
  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      initialData={initialData as Record<string, any>}
      editId={editSeriesId}
      onSuccess={onSuccess}
      schema={seriesFormSchema}
      defaultValues={{
        title: "",
        slug: "",
        description: "",
        thumbnailUrl: "",
        backdropUrl: "",
        trailerUrl: "",
        releaseDate: "",
        tagIds: [],
        tmdbId: undefined,
        originalLanguage: "",
      }}
      apiEndpoint="/api/admin/series"
      entityName="Series"
      tmdbMediaType="tv"
    />
  );
}
