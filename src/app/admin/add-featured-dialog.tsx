"use client";

import { memo } from "react";
import Image from "next/image";
import { Search, Plus, Film, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Movie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

const SearchResultRow = memo(function SearchResultRow({
  movie,
  disabled,
  onAdd,
}: {
  movie: Movie;
  disabled: boolean;
  onAdd: (movieId: number) => void;
}) {
  return (
    <button
      onClick={() => !disabled && onAdd(movie.id)}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
    >
      {movie.thumbnailUrl ? (
        <Image src={movie.thumbnailUrl} alt={movie.title} width={40} height={40} className="size-10 rounded object-cover" />
      ) : (
        <div className="size-10 rounded bg-muted flex items-center justify-center">
          <Film className="size-4 text-muted-foreground" />
        </div>
      )}
      <span className="font-medium truncate flex-1">{movie.title}</span>
      {disabled && <span className="text-xs text-muted-foreground">Already featured</span>}
    </button>
  );
});

export default function AddFeaturedDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  searchResults,
  searching,
  alreadyFeaturedIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Movie[];
  searching: boolean;
  alreadyFeaturedIds: Set<number>;
  onAdd: (movieId: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button><Plus className="size-4 mr-2" />Add Movie</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Featured Movie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search movies..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-5 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((movie) => (
                <SearchResultRow key={movie.id} movie={movie} disabled={alreadyFeaturedIds.has(movie.id)} onAdd={onAdd} />
              ))
            ) : searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-4">No movies found.</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Type to search movies.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
