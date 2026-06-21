"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useAuthLogout } from "@/lib/use-auth-logout";
import { UserX, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export default function DangerZone() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const { logout, isLoggingOut } = useAuthLogout();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
    },
    onSuccess: async () => {
      toast.success("Account deleted.");
      await authClient.signOut();
      router.replace("/login");
    },
    onError: () => {
      toast.error("Failed to delete account.");
    },
  });

  const onDelete = () => {
    if (confirmText !== "delete-my-account") {
      setConfirmError('Type "delete-my-account" to confirm');
      return;
    }
    setConfirmError("");
    deleteMutation.mutate();
  };

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-16 h-6" /></CardTitle>
          <CardDescription><Skeleton className="w-56 h-6" /></CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Sign out or permanently delete your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={logout} disabled={isLoggingOut} className="w-full">
          {isLoggingOut ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LogOut className="size-4 mr-2" />}
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>

        <Button
          variant="destructive"
          disabled={deleteMutation.isPending}
          className="w-full"
          onClick={() => setAlertOpen(true)}
        >
          <UserX className="size-4 mr-2" />
          {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
        </Button>

        <AlertDialog open={alertOpen} onOpenChange={(open) => { setAlertOpen(open); if (!open) { setConfirmText(""); setConfirmError("") } }}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. Type{" "}
              <span className="font-mono font-semibold text-foreground">delete-my-account</span>{" "}
              below to confirm.
            </AlertDialogDescription>
            <div className="mt-4 space-y-4">
              <div>
                <Input
                  value={confirmText}
                  onChange={(e) => { setConfirmText(e.target.value); setConfirmError("") }}
                  placeholder="delete-my-account"
                  className="font-mono"
                />
                {confirmError && (
                  <p className="text-xs text-destructive mt-1">{confirmError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <AlertDialogClose render={<Button variant="outline" type="button" />}>
                  Cancel
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={confirmText !== "delete-my-account" || deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
