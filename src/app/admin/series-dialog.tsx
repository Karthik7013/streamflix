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
      dialog={{ open, onOpenChange }}
      entity={{ initialData: initialData as Record<string, any>, editId: editSeriesId, entityName: "Series", assetFolder: "series" }}
      api={{
        endpoint: "/api/admin/series",
        schema: seriesFormSchema,
        defaultValues: {
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
        },
      }}
      callbacks={{ onSuccess }}
      tmdbMediaType="tv"
    />
  );
}
