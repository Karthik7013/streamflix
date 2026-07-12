"use client";

import { useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface UploadFieldProps {
  accept?: string;
  label: string;
  folder?: string;
  uploadKey?: string;
  maxSize?: number;
  value: string;
  onChange: (url: string) => void;
}

export function UploadField({ accept = "image/*", label, folder = "uploads", uploadKey, maxSize, value, onChange }: UploadFieldProps) {
  const { upload, uploading, progress, error } = useUpload({ folder, uploadKey, maxSize });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await upload(file);
      onChange(publicUrl);
    } catch {
      // error is managed by the hook
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-24 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-input px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Uploading... {progress}%</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-center">Click to upload {label.toLowerCase()}</span>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </div>
  );
}
