"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { ErrorState } from "@/components/error-state";
import { AuthLoading } from "@/components/auth-loading";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, loading, isError, retry } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session && !isError) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [session, loading, isError, router]);

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState message="Unable to verify your session." onRetry={retry} />
      </div>
    );
  }

  if (loading) {
    return <AuthLoading />;
  }

  if (!session) return null;

  return <>{children}</>;
}
