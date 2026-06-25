"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

export default function ClearWatchHistory() {
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => {
      setClearAlertOpen(false);
      queryClient.invalidateQueries({ queryKey: ["continue-watching"] });
    },
  });

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>Remove all your watched history at once.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setClearAlertOpen(true)}
            disabled={clearMutation.isPending}
          >
            <Trash2 className="size-4 mr-2" />
            {clearMutation.isPending ? "Clearing..." : "Clear Watch History"}
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
              onClick={() => clearMutation.mutate()}
            >
              Clear
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
