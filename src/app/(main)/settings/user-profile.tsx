"use client";

import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function UserProfile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await adminApi.upload.avatar(formData);
      await authClient.updateUser({ image: url });
      toast.success("Profile picture updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-16 h-6" /></CardTitle>
          <CardDescription><Skeleton className="w-56 h-6" /></CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-36 h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = session?.user;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative cursor-pointer"
          >
            <Avatar className="size-16">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="text-lg">{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{user?.name}</p>
            <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {user?.role === "admin" ? "Admin" : "User"}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">{user?.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
