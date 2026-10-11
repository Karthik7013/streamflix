"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  seeAllHref?: string;
  titleClassName?: string;
  className?: string;
}

export function SectionHeader({ title, seeAllHref, titleClassName, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className={cn("text-lg font-semibold font-heading", titleClassName)}>{title}</h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See All
        </Link>
      )}
    </div>
  );
}
