"use client";

import { useSession } from "@/hooks/use-session";
import { AuthLoading } from "@/components/auth-loading";

export function FetchAuth({ children }: { children: React.ReactNode }) {
  const { loading } = useSession();

  if (loading) {
    return <AuthLoading />;
  }
  return <>{children}</>;
}
