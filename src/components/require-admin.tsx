"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { ErrorState } from "@/components/error-state";
import { AuthLoading } from "@/components/auth-loading";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { data: session, loading, isError, retry } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isError && (!session || session.user.role !== "admin")) {
      router.replace("/");
    }
  }, [session, loading, isError, router]);

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState message="Unable to verify your session." onRetry={retry} />
      </div>
    );
  }

  if (loading) {
    return <AuthLoading />;
  }

  if (!session || session.user.role !== "admin") return null;

  return <>{children}</>;
}
