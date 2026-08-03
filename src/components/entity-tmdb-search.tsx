"use client";

import { Button } from "@/components/ui/button";
import { TmdbSearch } from "@/components/tmdb-search";
import type { TmdbImportResult } from "@/hooks/use-tmdb-search";

interface EntityTmdbSearchProps {
  entityName: string;
  mediaType: "movie" | "tv";
  open: boolean;
  onToggle: () => void;
  onImport: (data: TmdbImportResult) => void;
}

export function EntityTmdbSearch({ entityName, mediaType, open, onToggle, onImport }: EntityTmdbSearchProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" variant={open ? "default" : "outline"} size="sm" onClick={onToggle}>
          {open ? "Close TMDB Search" : "Search TMDB"}
        </Button>
        {open && (
          <p className="text-xs text-muted-foreground">
            Import {entityName.toLowerCase()} data from The Movie Database
          </p>
        )}
      </div>
      {open && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <TmdbSearch onImport={onImport} mediaType={mediaType} />
        </div>
      )}
    </>
  );
}
