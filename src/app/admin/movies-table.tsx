"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format";

interface Tag {
  id: number;
  name: string;
}

interface Movie {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

const MovieRow = memo(function MovieRow({
  movie,
  onEdit,
  onDelete,
}: {
  movie: Movie;
  onEdit: (m: Movie) => void;
  onDelete: (m: Movie) => void;
}) {
  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <Link href={`/movies/${movie.slug}`} className="flex items-center gap-3 group min-w-0">
          <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-muted-foreground/10">
            {movie.thumbnailUrl ? (
              <Image src={movie.thumbnailUrl} alt={movie.title} width={48} height={48} className="size-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="size-full flex items-center justify-center">
                <SearchIcon className="size-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{movie.title}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">{movie.description}</p>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap font-medium">
        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "—"}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {movie.durationSeconds ? formatDuration(movie.durationSeconds) : "—"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {movie.tags.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            movie.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="bg-primary text-primary-foreground border-none font-normal">
                {tag.name}
              </Badge>
            ))
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(movie)}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50" onClick={() => onDelete(movie)}>
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

export default function MoviesTable({
  movies,
  loading,
  onEdit,
  onDelete,
}: {
  movies: Movie[];
  loading: boolean;
  onEdit: (m: Movie) => void;
  onDelete: (m: Movie) => void;
}) {
  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="size-12 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-12 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <div className="flex gap-2 shrink-0">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return <div className="py-20 text-center text-muted-foreground">No movies found matching your criteria.</div>;
  }

  return (
    <table className="w-full min-w-200">
      <thead>
        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
          <th className="px-6 py-4 whitespace-nowrap">Title</th>
          <th className="px-6 py-4 whitespace-nowrap">Release</th>
          <th className="px-6 py-4 whitespace-nowrap">Duration</th>
          <th className="px-6 py-4 whitespace-nowrap">Tags</th>
          <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {movies.map((movie) => (
          <MovieRow key={movie.id} movie={movie} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
}
