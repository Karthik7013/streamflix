"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();
  const metaRef = useRef<HTMLMetaElement | null>(null);

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const meta = existing || document.createElement("meta");
    if (!existing) {
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    metaRef.current = meta;

    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    if (color) meta.content = color;

    return () => {
      if (!existing && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ThemeColorUpdater />
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
