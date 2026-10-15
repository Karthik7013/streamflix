"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Hash, AlertCircle, BookOpenText, Flag, ListChecks, BarChart3, Tags } from "lucide-react";
import { adminApi } from "@/lib/api-client/admin";
import { MovieCard } from "@/components/movie/movie-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="flex snap-x gap-3 overflow-x-auto pb-1">
      {movies.slice(0, 5).map((movie) => (
        <div key={movie.slug} className="w-36 shrink-0 snap-start">
          <MovieCard
            title={movie.title}
            slug={movie.slug}
            thumbnailUrl={movie.thumbnailUrl}
          />
        </div>
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

const ReportTriageList = memo(function ReportTriageList({ reports }: {
  reports: { id: number; description: string; movie: { title: string }; reporter: { name: string } }[];
}) {
  const queryClient = useQueryClient();
  const onResolve = useCallback(async (id: number) => {
    await queryClient.cancelQueries({ queryKey: ["admin-reports"] });
    const previous = queryClient.getQueryData(["admin-reports"]);
    try {
      await adminApi.reports.resolve(id, "resolved");
    } catch {
      if (previous !== undefined) queryClient.setQueryData(["admin-reports"], previous);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-2">
      {reports.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <p className="text-sm font-medium">#{r.id} · {r.movie.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Reported by {r.reporter.name}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => onResolve(r.id)}>
            Resolve
          </Button>
        </div>
      ))}
    </div>
  );
});

const RequestQueueList = memo(function RequestQueueList({ requests }: {
  requests: { id: number; title: string; description: string | null; requester: { name: string } }[];
}) {
  const queryClient = useQueryClient();
  const onFulfill = useCallback(async (id: number) => {
    await queryClient.cancelQueries({ queryKey: ["admin-requests"] });
    const previous = queryClient.getQueryData(["admin-requests"]);
    try {
      await adminApi.requests.fulfill(id);
    } catch {
      if (previous !== undefined) queryClient.setQueryData(["admin-requests"], previous);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  }, [queryClient]);

  return (
    <div className="flex flex-col gap-2">
      {requests.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <p className="text-sm font-medium">#{r.id} · {r.title}</p>
          {r.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">Requested by {r.requester.name}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => onFulfill(r.id)}>
            Mark fulfilled
          </Button>
        </div>
      ))}
    </div>
  );
});

const TagSuggestionList = memo(function TagSuggestionList({ movieId, current, available }: {
  movieId: number;
  current: { id: number; name: string }[];
  available: { id: number; name: string }[];
}) {
  const queryClient = useQueryClient();
  const others = available.filter((t) => !current.some((c) => c.id === t.id));
  const onApply = useCallback(async (tagId: number) => {
    const nextIds = [...current.map((c) => c.id), tagId];
    await queryClient.cancelQueries({ queryKey: ["admin-movies"] });
    const previous = queryClient.getQueryData(["admin-movies"]);
    try {
      await adminApi.movies.update(movieId, { tagIds: nextIds });
    } catch {
      if (previous !== undefined) queryClient.setQueryData(["admin-movies"], previous);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
  }, [queryClient, movieId, current]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {current.map((t) => (
          <Badge key={t.id} variant="secondary">{t.name}</Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {others.slice(0, 10).map((t) => (
          <Button key={t.id} size="sm" variant="outline" onClick={() => onApply(t.id)}>
            + {t.name}
          </Button>
        ))}
      </div>
    </div>
  );
});

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

  if (toolName === "listPendingReports") {
    const reports = output as {
      id: number;
      description: string;
      status: string;
      createdAt: string;
      movie: { title: string; slug: string };
      reporter: { name: string; email: string };
    }[];
    if (!Array.isArray(reports) || reports.length === 0) {
      return <ErrorState message="No pending reports" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<Flag className="size-3" />} label={`${reports.length} pending reports`} />
        <ReportTriageList reports={reports} />
      </div>
    );
  }

  if (toolName === "listPendingRequests") {
    const requests = output as {
      id: number;
      title: string;
      description: string | null;
      requester: { name: string; email: string };
    }[];
    if (!Array.isArray(requests) || requests.length === 0) {
      return <ErrorState message="No pending requests" />;
    }
    return (
      <div className="my-2">
        <ToolHeader icon={<ListChecks className="size-3" />} label={`${requests.length} pending requests`} />
        <RequestQueueList requests={requests} />
      </div>
    );
  }

  if (toolName === "getDashboardStats") {
    const data = output as { data?: { type: string; value: number; subtitle?: string }[] };
    const stats = data.data ?? [];
    if (stats.length === 0) return <ErrorState message="No stats available" />;
    return (
      <div className="my-2">
        <ToolHeader icon={<BarChart3 className="size-3" />} label="Site metrics" />
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.type} className="rounded-lg border border-border bg-background/60 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{s.type}</p>
              <p className="text-lg font-semibold">{s.value}</p>
              {s.subtitle && <p className="text-[11px] text-muted-foreground">{s.subtitle}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (toolName === "suggestTags") {
    const data = output as {
      movieId: number;
      currentTags: { id: number; name: string }[];
      availableTags: { id: number; name: string }[];
    };
    return (
      <div className="my-2">
        <ToolHeader icon={<Tags className="size-3" />} label="Tag suggestions" />
        <TagSuggestionList movieId={data.movieId} current={data.currentTags} available={data.availableTags} />
      </div>
    );
  }

  return null;
}