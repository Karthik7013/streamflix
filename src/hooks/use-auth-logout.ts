"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { setLoggingOut } from "@/lib/auth-redirect";

export function useAuthLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLoggingOut(true);
    authClient.signOut()
      .then(() => {
        queryClient.clear();
        router.replace("/login?loggedOut=1");
      })
      .catch((err) => {
        logger.error("auth", "Sign out failed", err);
        queryClient.clear();
        router.replace("/login?loggedOut=1");
      });
  }, [isLoggingOut, router, queryClient]);

  return { logout, isLoggingOut };
}
