"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, Loader2 } from "lucide-react";

interface UploadFieldProps {
  accept?: string;
  label: string;
  folder?: string;
  maxSize?: number;
  value: string;
  onChange: (url: string) => void;
}

export function UploadField({ accept = "*/*", label, folder = "uploads", maxSize, value, onChange }: UploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSize && file.size > maxSize) {
      const mb = maxSize / 1024 / 1024;
      setError(`File too large. Max ${mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb.toFixed(0)}MB`}.`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const params = new URLSearchParams({ fileName: file.name, folder });
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/upload/file?${params}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      const publicUrl = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.publicUrl);
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <Check className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{value.split("/").pop()}</span>
          <button
            type="button"
            onClick={() => onChange("")}
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
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
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
