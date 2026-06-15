"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { Trash2, UserX, LogOut, Camera, Loader2, Shield } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function SettingsContent() {
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        ))}
      </div>
    );
  }

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await fetch("/api/users/history", { method: "DELETE" });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch("/api/users/account", { method: "DELETE" });
      await authClient.signOut();
      window.location.replace("/login");
    } catch {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.replace("/login");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await authClient.updateUser({ image: dataUrl });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const user = session?.user;

  return (
    <div className="space-y-4">
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
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>Remove all your watched history at once.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setClearAlertOpen(true)}
            disabled={clearing}
          >
            <Trash2 className="size-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Watch History"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={clearAlertOpen} onOpenChange={setClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Clear Watch History</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove all your watch history. This action
            cannot be undone.
          </AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialogClose render={<Button variant="outline" />}>
                Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
            >
              Clear
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
            <CardDescription>Access the admin panel to manage users and settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button variant="outline" className="w-full">
                <Shield className="size-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign out or permanently delete your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>

          <Button
            variant="destructive"
            disabled={deleting}
            className="w-full"
            onClick={() => setAlertOpen(true)}
          >
            <UserX className="size-4 mr-2" />
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>

          <AlertDialog open={alertOpen} onOpenChange={(open) => { setAlertOpen(open); if (!open) setConfirmText(""); }}>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent and cannot be undone. Type{" "}
                <span className="font-mono font-semibold text-foreground">delete-my-account</span>{" "}
                below to confirm.
              </AlertDialogDescription>
              <div className="mt-4 space-y-4">
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="delete-my-account"
                  className="font-mono"
                />
                <div className="flex justify-end gap-3">
                  <AlertDialogClose render={<Button variant="outline" />}>
                      Cancel
                  </AlertDialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={confirmText !== "delete-my-account" || deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
