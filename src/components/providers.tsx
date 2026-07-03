"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { STALE } from "@/lib/stale-times";

function SessionWatcher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const prevSessionRef = useRef(session);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (!initialisedRef.current) {
      initialisedRef.current = true;
      return;
    }

    if (prevSessionRef.current && !session && !isPending) {
      toast.error("Session expired");
      queryClient.clear();
      window.location.href = "/login?sessionExpired=1";
    }

    prevSessionRef.current = session;
  }, [session, isPending, queryClient]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE.HOUR,
            gcTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionWatcher>{children}</SessionWatcher>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
