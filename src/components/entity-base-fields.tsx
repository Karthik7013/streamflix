"use client";

import { useMemo } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadField } from "@/components/upload-field";
import { TagSelector } from "@/components/tag-selector";
import { generateSlug } from "@/lib/validation";

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

export interface EntityBaseFieldsProps {
  ctx: FormSlotContext;
  entityName: string;
  assetFolder: string;
  slugManuallyEdited: boolean;
  onSlugManuallyEdited: (v: boolean) => void;
  selectedTagIds: number[];
  onToggleTag: (tagId: number) => void;
}

export function EntityBaseFields({
  ctx,
  entityName,
  assetFolder,
  slugManuallyEdited,
  onSlugManuallyEdited,
  selectedTagIds,
  onToggleTag,
}: EntityBaseFieldsProps) {
  const { register, watch, setValue, errors } = ctx;
  const year = useMemo(() => new Date().getFullYear(), []);

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
            uploadKey={watch("slug") ? `${assetFolder}/${year}/${watch("slug")}/thumbnails/01.jpg` : undefined}
            folder="thumbnails"
            value={watch("thumbnailUrl") ?? ""}
            onChange={(url: string) => setValue("thumbnailUrl", url)}
          />
        </div>
        <div className="space-y-1.5">
          <UploadField
            label="Backdrop"
            uploadKey={watch("slug") ? `${assetFolder}/${year}/${watch("slug")}/backdrops/01.jpg` : undefined}
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
