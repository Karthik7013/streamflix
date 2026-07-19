"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="animate-pulse inline-flex items-center gap-2 text-5xl font-bold tracking-tight text-foreground">
          <svg viewBox="0 0 100 100" className="size-12 shrink-0">
            <circle cx="50" cy="50" r="50" className="fill-primary" />
            <path d="M38 28 L74 50 L38 72 Z" className="fill-black" />
          </svg>
          StreamFlix
        </span>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
