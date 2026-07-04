"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function useAuthLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    authClient.signOut()
      .catch(() => {})
      .finally(() => {
        router.push("/login?loggedOut=1");
      });
  }, [isLoggingOut, router]);

  return { logout, isLoggingOut };
}
