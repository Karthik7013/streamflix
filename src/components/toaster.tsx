"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <>
      <style>{`
        [data-sonner-toast][data-type="success"] {
          background: color-mix(in oklab, var(--primary) 12%, transparent) !important;
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }
        [data-sonner-toast][data-type="error"] {
          background: color-mix(in oklab, var(--destructive) 50%, transparent) !important;
          border-color: var(--destructive) !important;
          color: var(--destructive) !important;
        }
        [data-sonner-toast][data-type="info"] {
          background: color-mix(in oklab, var(--accent) 12%, transparent) !important;
          border-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
        }
        [data-sonner-toast][data-type="warning"] {
          background: color-mix(in oklab, oklch(0.85 0.13 85) 12%, transparent) !important;
          border-color: oklch(0.85 0.13 85) !important;
          color: oklch(0.85 0.13 85) !important;
        }
      `}</style>
      <SonnerToaster
        theme="dark"
        position="bottom-right"
      />
    </>
  );
}
