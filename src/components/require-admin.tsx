"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { data: session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!session || session.user.role !== "admin")) {
      router.replace("/");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") return null;

  return <>{children}</>;
}
