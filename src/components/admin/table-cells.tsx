"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

export interface TableAction {
  key: string;
  icon: ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
}

export function DateCell({ date }: { date?: string | null }) {
  return (
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {date ? new Date(date).toLocaleDateString() : "\u2014"}
    </span>
  );
}

export function YearCell({ date }: { date?: string | null }) {
  return (
    <span className="text-sm whitespace-nowrap font-medium">
      {date ? new Date(date).getFullYear() : "\u2014"}
    </span>
  );
}

export function PublishedStatusCell({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        published
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function TagsCell({ tags }: { tags: Tag[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.length === 0 ? (
        <span className="text-xs text-muted-foreground">{"\u2014"}</span>
      ) : (
        tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="bg-primary text-primary-foreground border-none font-normal"
          >
            {tag.name}
          </Badge>
        ))
      )}
    </div>
  );
}

export function UserCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="text-sm">
      <div>{name}</div>
      <div className="text-xs text-muted-foreground">{email}</div>
    </div>
  );
}

export function MediaTitleCell({
  href,
  title,
  description,
  thumbnail,
  icon,
}: {
  href: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 group min-w-0">
      <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-muted-foreground/10">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            width={48}
            height={48}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-muted-foreground/40">
            {icon}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground truncate max-w-[240px]">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ActionButtonsCell({ actions }: { actions: TableAction[] }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant="ghost"
          size="icon"
          className={cn(
            "size-8",
            action.danger &&
              "text-rose-500 hover:text-rose-600 hover:bg-rose-50/50",
          )}
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.title}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  );
}