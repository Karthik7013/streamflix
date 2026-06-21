"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useAuthLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(() => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    authClient.signOut().catch(() => {}).finally(() => setIsLoggingOut(false));
    window.location.href = "/login?loggedOut=1";
  }, [isLoggingOut]);

  return { logout, isLoggingOut };
}
