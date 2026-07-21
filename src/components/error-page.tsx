"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  message?: string;
  reset: () => void;
}

export function ErrorPage({ message, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {message || "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
