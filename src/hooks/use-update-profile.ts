"use client";

import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";

export function useUpdateProfile() {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const uploadAvatar = useCallback(async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data: avatarData } = await adminApi.upload.avatar(formData);
      await authClient.updateUser({ image: avatarData.publicUrl });
      toast.success("Profile picture updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  const uploadCover = useCallback(async (file: File) => {
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data: coverData } = await adminApi.upload.cover(formData);
      await authClient.updateUser({ coverImage: coverData.publicUrl });
      toast.success("Cover image updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      throw err;
    } finally {
      setUploadingCover(false);
    }
  }, []);

  return { uploadAvatar, uploadCover, uploadingAvatar, uploadingCover };
}
