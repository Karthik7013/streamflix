"use client";

import { MovieCard } from "@/components/movie-card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Film, Hash, AlertCircle, BookOpenText } from "lucide-react";

interface MovieResult {
  title: string;
  slug: string;
  thumbnailUrl: string;
  tags?: string[];
}

interface GenreResult {
  name: string;
  slug: string;
}

interface ToolOutput {
  toolName: string;
  output: unknown;
}

function MovieGrid({ movies }: { movies: MovieResult[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {movies.slice(0, 5).map((movie) => (
        <MovieCard
          key={movie.slug}
          title={movie.title}
          slug={movie.slug}
          thumbnailUrl={movie.thumbnailUrl}
        />
      ))}
    </div>
  );
}

function GenreChips({ genres }: { genres: GenreResult[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <Link key={genre.slug} href={`/tags/${genre.slug}`}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
            <Hash className="size-3 mr-1" />
            {genre.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <AlertCircle className="size-4 text-destructive" />
      <span>{message}</span>
    </div>
  );
}

function ToolHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}

interface DocSource {
  title: string;
  slug: string;
  url: string;
  summary: string;
}

function DocSources({ sources }: { sources: DocSource[] }) {
  return (
    <div className="flex flex-col gap-2">
      {sources.slice(0, 5).map((source) => (
        <Link
          key={source.slug}
          href={source.url}
          className="group rounded-lg border border-border bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/40"
        >
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {source.title}
          </p>
          {source.summary && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {source.summary}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export function ToolResultCards({ toolName, output }: ToolOutput) {
  if (!output) return null;

  // Movies array (searchMovies, getTrendingMovies)
  if (toolName === "searchMovies" || toolName === "getTrendingMovies") {
    const movies = output as MovieResult[];
    if (!Array.isArray(movies) || movies.length === 0) {
      return <ErrorState message="No movies found" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<Film className="size-3" />} label={`${movies.length} movies found`} />
        <MovieGrid movies={movies} />
      </div>
    );
  }

  // getMoviesByGenre (object with genre + movies, or error)
  if (toolName === "getMoviesByGenre") {
    const data = output as { genre?: string; movies?: MovieResult[]; error?: string; availableGenres?: string[] };
    if (data.error) {
      return (
        <div className="my-2">
          <ErrorState message={data.error} />
          {data.availableGenres && data.availableGenres.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Available genres:</p>
              <div className="flex flex-wrap gap-1.5">
                {data.availableGenres.map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (!data.movies || data.movies.length === 0) {
      return <ErrorState message={`No movies found for "${data.genre}"`} />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<Film className="size-3" />} label={`${data.movies.length} ${data.genre} movies`} />
        <MovieGrid movies={data.movies} />
      </div>
    );
  }

  // getAllGenres
  if (toolName === "getAllGenres") {
    const genres = output as GenreResult[];
    if (!Array.isArray(genres) || genres.length === 0) {
      return <ErrorState message="No genres available" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<Hash className="size-3" />} label={`${genres.length} genres available`} />
        <GenreChips genres={genres} />
      </div>
    );
  }

  // searchMoviesByDescription (semantic / plot-based search)
  if (toolName === "searchMoviesByDescription") {
    const data = output as { movies?: MovieResult[]; error?: string; sources?: unknown[] };
    if (data.error) {
      return <ErrorState message={data.error} />;
    }
    if (!data.movies || data.movies.length === 0) {
      return <ErrorState message="No matching movies found" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<Film className="size-3" />} label={`${data.movies.length} movies found`} />
        <MovieGrid movies={data.movies} />
      </div>
    );
  }

  // searchPlatformDocs (platform help articles)
  if (toolName === "searchPlatformDocs") {
    const data = output as { sources?: DocSource[]; error?: string };
    if (data.error && (!data.sources || data.sources.length === 0)) {
      return <ErrorState message={data.error} />;
    }
    if (!data.sources || data.sources.length === 0) {
      return <ErrorState message="No matching help articles found" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<BookOpenText className="size-3" />} label="Help articles" />
        <DocSources sources={data.sources} />
      </div>
    );
  }

  return null;
}
