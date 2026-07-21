"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changePassword = useCallback(
    async (data: ChangePasswordInput) => {
      setIsSubmitting(true);
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
      setIsSubmitting(false);

      if (error) {
        toast.error(error.message || "Unable to update password.");
        return false;
      }

      toast.success("Password updated.");
      return true;
    },
    [],
  );

  return { changePassword, isSubmitting };
}
