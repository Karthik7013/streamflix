"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function useAuthLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    authClient.signOut()
      .then(() => {
        queryClient.clear();
        router.replace("/login?loggedOut=1");
      })
      .catch((err) => {
        console.error("auth", "Sign out failed", err);
        setIsLoggingOut(false);
      });
  }, [isLoggingOut, router, queryClient]);

  return { logout, isLoggingOut };
}
