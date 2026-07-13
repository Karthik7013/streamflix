"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { UploadField } from "@/components/upload-field";
import { TmdbSearch, type TmdbImportResult } from "@/components/tmdb-search";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/validation";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";
import { TagSelector } from "@/components/tag-selector";

export interface FormSlotContext {
  register: ReturnType<typeof useForm>["register"];
  watch: ReturnType<typeof useForm>["watch"];
  setValue: ReturnType<typeof useForm>["setValue"];
  errors: Record<string, { message?: string } | undefined>;
}
export interface EntityDialogProps {
  dialog: { open: boolean; onOpenChange: (v: boolean) => void };
  entity: { initialData?: Record<string, any>; editId?: number; entityName: string; assetFolder: string };
  api: { endpoint: string; schema: ZodType<any>; defaultValues: Record<string, any> };
  callbacks: { onSuccess: () => void; onBeforeSubmit?: (data: Record<string, any>) => Record<string, unknown> };
  tmdbMediaType?: "movie" | "tv";
  children?: (ctx: FormSlotContext) => React.ReactNode;
}

export function EntityDialog({
  dialog: { open, onOpenChange },
  entity: { initialData, editId, entityName, assetFolder },
  api: { endpoint: apiEndpoint, schema, defaultValues },
  callbacks: { onSuccess, onBeforeSubmit },
  tmdbMediaType,
  children,
}: EntityDialogProps) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showTmdbSearch, setShowTmdbSearch] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ ...defaultValues, ...initialData });
        setSlugManuallyEdited(!!initialData.slug);
      } else {
        reset();
        setSlugManuallyEdited(false);
      }
      setShowTmdbSearch(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedTagIds = watch("tagIds") ?? [];

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      const body = onBeforeSubmit ? onBeforeSubmit(formData) : formData;

      if (editId) {
        const res = await apiFetch(`${apiEndpoint}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await apiFetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Create failed");
      }
    },
    onSuccess: () => {
      toast.success(editId ? `${entityName} updated.` : `${entityName} created.`);
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => {
      logger.error("entity-dialog", "Save failed", err);
      toast.error(editId ? `Unable to update ${entityName.toLowerCase()}.` : `Unable to create ${entityName.toLowerCase()}.`);
    },
  });

  function handleDialogOpen(v: boolean) {
    onOpenChange(v);
  }

  function onSubmit(data: Record<string, any>) {
    save(data);
  }

  function handleTmdbImport(data: TmdbImportResult) {
    setValue("title", data.title);
    setValue("slug", generateSlug(data.title));
    setValue("description", data.overview);
    setValue("releaseDate", data.releaseDate);
    setValue("originalLanguage", data.originalLanguage);
    if (data.thumbnailUrl) {
      setValue("thumbnailUrl", data.thumbnailUrl);
    }
    if (data.backdropUrl) {
      setValue("backdropUrl", data.backdropUrl);
    }
    if (data.trailerUrl) {
      setValue("trailerUrl", data.trailerUrl);
    }
    if (data.durationSeconds) {
      setValue("durationSeconds", String(data.durationSeconds));
    }
    setSlugManuallyEdited(true);
    setShowTmdbSearch(false);
  }

  function toggleTag(tagId: number) {
    const current: number[] = watchedTagIds;
    const next = current.includes(tagId)
      ? current.filter((id: number) => id !== tagId)
      : [...current, tagId];
    setValue("tagIds", next, { shouldValidate: true });
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editId ? `Edit ${entityName}` : `Add ${entityName}`}</DialogTitle>
          <DialogDescription>
            {editId
              ? `Update the ${entityName.toLowerCase()} details below.`
              : `Fill in the details to add a new ${entityName.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {tmdbMediaType && (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={showTmdbSearch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTmdbSearch(!showTmdbSearch)}
                  >
                    {showTmdbSearch ? "Close TMDB Search" : "Search TMDB"}
                  </Button>
                  {showTmdbSearch && (
                    <p className="text-xs text-muted-foreground">
                      Import {entityName.toLowerCase()} data from The Movie Database
                    </p>
                  )}
                </div>
                {showTmdbSearch && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <TmdbSearch onImport={handleTmdbImport} mediaType={tmdbMediaType} />
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  {...register("title")}
                  onChange={(e) => {
                    setValue("title", e.target.value, { shouldValidate: true });
                    if (!slugManuallyEdited) {
                      setValue("slug", generateSlug(e.target.value), { shouldValidate: false });
                    }
                  }}
                  placeholder={`${entityName} title`}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  {...register("slug")}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setValue("slug", e.target.value, { shouldValidate: true });
                  }}
                  placeholder={`${entityName.toLowerCase()}-slug`}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message as string}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                {...register("description")}
                placeholder={`${entityName} description`}
                className="min-h-20"
              />
            </div>
            {children?.({ register, watch, setValue, errors })}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <UploadField
                  label="Thumbnail"
                  uploadKey={watch("slug") ? `${assetFolder}/${new Date().getFullYear()}/${watch("slug")}/thumbnails/01.jpg` : undefined}
                  folder="thumbnails"
                  value={watch("thumbnailUrl") ?? ""}
                  onChange={(url: string) => setValue("thumbnailUrl", url)}
                />
              </div>
              <div className="space-y-1.5">
                <UploadField
                  label="Backdrop"
                  uploadKey={watch("slug") ? `${assetFolder}/${new Date().getFullYear()}/${watch("slug")}/backdrops/01.jpg` : undefined}
                  folder="backdrops"
                  value={watch("backdropUrl") ?? ""}
                  onChange={(url: string) => setValue("backdropUrl", url)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Release Date</label>
              <Input type="date" {...register("releaseDate")} />
            </div>
            <TagSelector
              selectedIds={watchedTagIds}
              onToggle={toggleTag}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => handleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
