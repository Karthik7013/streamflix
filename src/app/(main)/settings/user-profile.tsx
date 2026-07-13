"use client";

import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  coverImage?: string | null;
  role?: string | null;
}

interface UserProfileProps {
  data: { user: SessionUser } | null;
  loading: boolean;
  isError: boolean;
  retry: () => void;
}

export default function UserProfile({ data: session, loading }: UserProfileProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = "";
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <Card className="gap-0 rounded-none border border-border bg-background py-0 ring-0" size="sm">
        <Skeleton className="h-32 w-full rounded-none" />
        <CardContent className="px-6 pb-6">
          <Skeleton className="-mt-10 size-20 rounded-full border-4 border-background" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = session?.user;

  return (
    <Card className="gap-0 p-0 border border-border bg-background ring-0">
      <div className="relative h-32 w-full overflow-hidden">
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
        {user?.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-linear-to-br from-foreground/15 via-muted to-muted-foreground/10"
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors hover:bg-black/40"
        >
          {uploadingCover ? (
            <Loader2 className="size-6 animate-spin text-white" />
          ) : (
            <Camera className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
          )}
        </button>
      </div>
      <CardContent className="px-6 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="relative">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="group relative -mt-10 cursor-pointer"
            >
              <Avatar className="size-20 border-4 border-background">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="text-2xl">{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity ${uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                {uploadingAvatar ? (
                  <Loader2 className="size-6 animate-spin text-white" />
                ) : (
                  <Camera className="size-6 text-white" />
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{user?.name}</h1>
          <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
            {user?.role === "admin" ? "Admin" : "User"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </CardContent>
    </Card>
  );
}
