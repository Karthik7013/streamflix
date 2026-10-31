"use client";

import { useState, useCallback } from "react";
import { adminUploadApi } from "@/lib/api-client/admin";

interface UseUploadOptions {
  folder?: string;
  uploadKey?: string;
  maxSize?: number;
}

interface UseUploadReturn {
  upload: (file: File) => Promise<string>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

function formatMaxSize(maxSize: number): string {
  const mb = maxSize / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb.toFixed(0)}MB`;
}

export function useUpload({ folder = "uploads", uploadKey, maxSize }: UseUploadOptions = {}): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      if (maxSize && file.size > maxSize) {
        throw new Error(`File too large. Max ${formatMaxSize(maxSize)}.`);
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : "";
        const key = uploadKey ? uploadKey.replace(/\.[^.]+$/, ext) : undefined;
        const data = await adminUploadApi.uploadFile(file, { folder, key });
        setProgress(100);
        return data.publicUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [folder, maxSize, uploadKey]
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setUploading(false);
  }, []);

  return { upload, uploading, progress, error, reset };
}
