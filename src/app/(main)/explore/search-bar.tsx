"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

interface SearchButtonProps {
  onClick: () => void;
}

type SearchBarProps = SearchInputProps | SearchButtonProps;

export function SearchBar(props: SearchBarProps) {
  if ("value" in props) {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-3.5 transition-all has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/20 has-[input:focus-visible]:bg-background">
        <Search className="size-4 shrink-0 text-muted-foreground/60" />
        <input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Search movies..."
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    );
  }

  return (
    <button
      onClick={props.onClick}
      className="flex h-10 w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/50 px-3.5 text-sm text-muted-foreground/60 transition-all hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:bg-background outline-none"
    >
      <Search className="size-4" />
      <span>Search</span>
    </button>
  );
}
