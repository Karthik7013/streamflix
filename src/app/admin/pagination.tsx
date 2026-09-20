"use client";

import { type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label,
  goNext,
  goPrev,
  hasMore,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: ReactNode;
  goNext?: () => void;
  goPrev?: () => void;
  hasMore?: boolean;
}) {
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const useCursor = !!goNext && !!goPrev;

  if (!useCursor && totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      {label}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => useCursor ? goPrev!() : onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        {!useCursor && pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1">...</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
        {useCursor && (
          <span className="px-2 text-xs">Page {page}</span>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={useCursor ? !hasMore : page >= totalPages}
          onClick={() => useCursor ? goNext!() : onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
