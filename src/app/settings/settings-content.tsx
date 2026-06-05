"use client";

import { useState } from "react";
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
import { Trash2, UserX, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";

export function SettingsContent() {
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleClearHistory = async () => {
    if (!confirm("Clear all watch history?")) return;
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

  return (
    <div className="space-y-4">
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
            onClick={handleClearHistory}
            disabled={clearing}
          >
            <Trash2 className="size-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Watch History"}
          </Button>
        </CardContent>
      </Card>

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
                  <AlertDialogClose>
                    <span className="inline-flex h-9 w-full cursor-default items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted transition-colors">
                      Cancel
                    </span>
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
