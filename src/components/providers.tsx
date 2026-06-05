"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();
  const metaRef = useRef<HTMLMetaElement | null>(null);

  useEffect(() => {
    const meta = metaRef.current || document.querySelector('meta[name="theme-color"]') || (() => {
      const m = document.createElement("meta");
      m.name = "theme-color";
      document.head.appendChild(m);
      return m;
    })();
    metaRef.current = meta;

    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    if (color) meta.content = color;
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ThemeColorUpdater />
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
