"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { seriesFormSchema, type SeriesFormData } from "@/lib/schemas";
import { EntityDialog } from "@/components/entity-dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
          published: false,
        },
      }}
      callbacks={{ onSuccess }}
      tmdbMediaType="tv"
    >
      {({ watch, setValue }) => {
        const published = watch("published");
        return (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Checkbox
              id="published"
              checked={published ?? false}
              onCheckedChange={(checked: boolean) => setValue("published", checked)}
            />
            <label htmlFor="published" className="text-sm font-medium cursor-pointer select-none">
              Published
            </label>
          </div>
        );
      }}
    </EntityDialog>
  );
}
