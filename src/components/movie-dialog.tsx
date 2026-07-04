"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { movieFormSchema, type MovieFormData } from "@/lib/schemas";
import { EntityDialog } from "@/components/entity-dialog";
import { generateSlug } from "@/lib/validation";

interface MovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MovieFormData>;
  editMovieId?: number;
  onSuccess: () => void;
}

export function MovieDialog({ open, onOpenChange, initialData, editMovieId, onSuccess }: MovieDialogProps) {
  const [copied, setCopied] = useState(false);

  function computeMoviePath(slug: string | undefined, title: string | undefined, releaseDate: string | undefined, suffix: string): string {
    const resolvedSlug = slug || generateSlug(title || "");
    const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
    return `movies/${year}/${resolvedSlug}/${suffix}`;
  }

  return (
    <EntityDialog
      dialog={{ open, onOpenChange }}
      entity={{ initialData: initialData as Record<string, any>, editId: editMovieId, entityName: "Movie", assetFolder: "movies" }}
      api={{
        endpoint: "/api/admin/movies",
        schema: movieFormSchema,
        defaultValues: {
          title: "",
          slug: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          backdropUrl: "",
          trailerUrl: "",
          durationSeconds: "",
          releaseDate: "",
          tagIds: [],
          tmdbId: undefined,
          originalLanguage: "",
        },
      }}
      callbacks={{
        onSuccess,
        onBeforeSubmit: (data) => {
        const body: Record<string, unknown> = { ...data, durationSeconds: parseInt(data.durationSeconds ?? "") || null };
        if (!editMovieId) delete body.videoUrl;
        return body;
      }}}
    >
      {({ register, watch, errors }) => {
        const slug = watch("slug");
        const title = watch("title");
        const releaseDate = watch("releaseDate");
        const path = computeMoviePath(slug, title, releaseDate, "videos/movie.mp4");

        function handleCopy() {
          navigator.clipboard.writeText(`transcode-ia /path/to/file.mp4 --key ${path}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }

        return (
          <>
            <div className="space-y-1.5 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Video Upload</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded p-1 transition-colors hover:bg-white/10"
                >
                  {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                After saving, run: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">transcode-ia /path/to/file.mp4 --key {path}</code>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Input type="number" {...register("durationSeconds")} placeholder="3600" />
                {errors.durationSeconds && (
                  <p className="text-xs text-destructive">{errors.durationSeconds.message as string}</p>
                )}
              </div>
            </div>
          </>
        );
      }}
    </EntityDialog>
  );
}
