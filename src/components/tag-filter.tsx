"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tag } from "@/types";

const SKELETON_ITEMS_8 = Array.from({ length: 8 }, (_, i) => i);

const tagStyles = [
  { bg: "bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20", emoji: "🔥" },
  { bg: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20", emoji: "🎬" },
  { bg: "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20", emoji: "🎭" },
  { bg: "bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20", emoji: "🎨" },
  { bg: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20", emoji: "⭐" },
  { bg: "bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20", emoji: "💫" },
  { bg: "bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20", emoji: "🎯" },
  { bg: "bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20", emoji: "🏆" },
  { bg: "bg-pink-500/15 text-pink-600 hover:bg-pink-500/25 dark:bg-pink-500/10 dark:text-pink-400 dark:hover:bg-pink-500/20", emoji: "💎" },
  { bg: "bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20", emoji: "🎪" },
  { bg: "bg-teal-500/15 text-teal-600 hover:bg-teal-500/25 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20", emoji: "🌊" },
  { bg: "bg-violet-500/15 text-violet-600 hover:bg-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20", emoji: "✨" },
];

const activeTagStyles = [
  "bg-red-500 text-white dark:bg-red-600",
  "bg-emerald-500 text-white dark:bg-emerald-600",
  "bg-blue-500 text-white dark:bg-blue-600",
  "bg-purple-500 text-white dark:bg-purple-600",
  "bg-amber-500 text-white dark:bg-amber-600",
  "bg-rose-500 text-white dark:bg-rose-600",
  "bg-cyan-500 text-white dark:bg-cyan-600",
  "bg-orange-500 text-white dark:bg-orange-600",
  "bg-pink-500 text-white dark:bg-pink-600",
  "bg-indigo-500 text-white dark:bg-indigo-600",
  "bg-teal-500 text-white dark:bg-teal-600",
  "bg-violet-500 text-white dark:bg-violet-600",
];

export const TagFilter = memo(function TagFilter({
  data,
  loading,
  selectedTags,
  onToggle,
}: {
  data: Tag[];
  loading: boolean;
  selectedTags: number[];
  onToggle: (tagId: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto flex-nowrap no-scrollbar">
        {SKELETON_ITEMS_8.map((i) => (
          <Skeleton key={i} className="shrink-0 h-9 w-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex gap-2 overflow-x-auto flex-nowrap no-scrollbar">
        <button className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium bg-primary text-primary-foreground">
          All
        </button>
        <p className="text-sm text-muted-foreground self-center">No tags available.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto flex-nowrap no-scrollbar">
      <button
        onClick={() => onToggle(-1)}
        className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
          selectedTags.length === 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {data.map((tag) => {
        const isActive = selectedTags.includes(tag.id);
        const idx = tag.id % tagStyles.length;
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? activeTagStyles[idx]
                : tagStyles[idx].bg
            }`}
          >
            <span>{tagStyles[idx].emoji}</span>
            <span>{tag.name}</span>
          </button>
        );
      })}
    </div>
  );
});


