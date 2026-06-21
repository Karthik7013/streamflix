"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationProgress } from "@/components/navigation-progress";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

function SessionWatcher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
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
            staleTime: 30 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavigationProgress />
        <SessionWatcher>{children}</SessionWatcher>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
