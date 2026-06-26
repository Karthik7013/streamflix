"use client";

import { useRef } from "react";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface UploadFieldProps {
  accept?: string;
  label: string;
  folder?: string;
  key?: string;
  maxSize?: number;
  value: string;
  onChange: (url: string) => void;
  onRemove?: (url: string) => void;
}

export function UploadField({ accept = "*/*", label, folder = "uploads", key: uploadKey, maxSize, value, onChange, onRemove }: UploadFieldProps) {
  const { upload, uploading, progress, error } = useUpload({ folder, key: uploadKey, maxSize });
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
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          <Check className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{value.split("/").pop()}</span>
          <button
            type="button"
            onClick={() => {
              onRemove?.(value);
              onChange("");
            }}
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-white/10"
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
