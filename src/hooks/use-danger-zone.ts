"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { usersApi } from "@/lib/api/users";
import { logger } from "@/lib/logger";

export function useDeleteAccount(onSuccess: () => void) {
  return useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: async () => {
      toast.success("Account deleted.");
      try {
        await authClient.signOut();
      } catch (err) {
        logger.error("danger-zone", "signOut after account deletion failed", err);
      }
      onSuccess();
    },
    onError: (err) => {
      logger.error("danger-zone", "Delete account failed", err);
      toast.error("Unable to delete your account.");
    },
  });
}
