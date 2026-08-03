"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/validation";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";
import { TagSelector } from "@/components/tag-selector";
import { EntityTmdbSearch } from "@/components/entity-tmdb-search";
import type { TmdbImportResult } from "@/hooks/use-tmdb-search";

export interface EntityFormFields {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  backdropUrl: string;
  releaseDate: string;
  tagIds: number[];
  originalLanguage: string;
  tmdbId?: number;
  published?: boolean;
  trailerUrl?: string;
  durationSeconds?: string;
  videoUrl?: string;
}

export interface FormSlotContext {
  register: UseFormRegister<EntityFormFields>;
  watch: UseFormWatch<EntityFormFields>;
  setValue: UseFormSetValue<EntityFormFields>;
  errors: FieldErrors<EntityFormFields>;
}

export interface EntityDialogProps {
  dialog: { open: boolean; onOpenChange: (v: boolean) => void };
  entity: { initialData?: Partial<EntityFormFields>; editId?: number; entityName: string; assetFolder: string };
  api: { endpoint: string; schema: ZodType<EntityFormFields, EntityFormFields>; defaultValues: EntityFormFields };
  callbacks: { onSuccess: () => void; onBeforeSubmit?: (data: EntityFormFields) => Record<string, unknown> };
  tmdbMediaType?: "movie" | "tv";
  children?: (ctx: FormSlotContext) => React.ReactNode;
}

interface EntityBaseFieldsProps {
  ctx: FormSlotContext;
  entityName: string;
  assetFolder: string;
  slugManuallyEdited: boolean;
  onSlugManuallyEdited: (v: boolean) => void;
  selectedTagIds: number[];
  onToggleTag: (tagId: number) => void;
}

function EntityBaseFields({
  ctx,
  entityName,
  assetFolder,
  slugManuallyEdited,
  onSlugManuallyEdited,
  selectedTagIds,
  onToggleTag,
}: EntityBaseFieldsProps) {
  const { register, watch, setValue, errors } = ctx;

  return (
    <>
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
              onSlugManuallyEdited(true);
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
        selectedIds={selectedTagIds}
        onToggle={onToggleTag}
      />
    </>
  );
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
    resolver: zodResolver(schema),
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
    mutationFn: async (formData: EntityFormFields) => {
      const body = onBeforeSubmit ? onBeforeSubmit(formData) : formData;

      if (editId) {
        await apiFetch(`${apiEndpoint}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
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

  function onSubmit(data: EntityFormFields) {
    save(data);
  }

  function handleTmdbImport(data: TmdbImportResult) {
    setValue("title", data.title);
    setValue("slug", generateSlug(data.title));
    setValue("description", data.overview);
    setValue("releaseDate", data.releaseDate);
    setValue("originalLanguage", data.originalLanguage);
    setValue("tmdbId", data.tmdbId);
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
    const current = [...watchedTagIds];
    const next = current.includes(tagId)
      ? current.filter((id: number) => id !== tagId)
      : [...current, tagId];
    setValue("tagIds", next, { shouldValidate: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>{editId ? `Edit ${entityName}` : `Add ${entityName}`}</DialogTitle>
          <DialogDescription>
            {editId
              ? `Update the ${entityName.toLowerCase()} details below.`
              : `Fill in the details to add a new ${entityName.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
          <div className="space-y-4 overflow-y-auto px-6 max-h-[55vh]">
            {tmdbMediaType && (
              <EntityTmdbSearch
                entityName={entityName}
                mediaType={tmdbMediaType}
                open={showTmdbSearch}
                onToggle={() => setShowTmdbSearch((v) => !v)}
                onImport={handleTmdbImport}
              />
            )}
            <EntityBaseFields
              ctx={{ register, watch, setValue, errors }}
              entityName={entityName}
              assetFolder={assetFolder}
              slugManuallyEdited={slugManuallyEdited}
              onSlugManuallyEdited={setSlugManuallyEdited}
              selectedTagIds={watchedTagIds}
              onToggleTag={toggleTag}
            />
            {children?.({ register, watch, setValue, errors })}
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/50">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
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
