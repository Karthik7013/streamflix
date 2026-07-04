"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShimmerImage } from "@/components/shimmer-image";
import { ChevronLeft, Film, Clock, Calendar, RefreshCw } from "lucide-react";
import { moviesApi } from "@/lib/api/movies";
import { ApiError } from "@/lib/api/client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const StreamflixPlayer = dynamic(
  () => import("@/components/streamflix-player").then((m) => ({ default: m.StreamflixPlayer })),
  {
    loading: () => <Skeleton className="aspect-video w-full rounded-lg" />,
  }
);
import { BackButton } from "@/components/back-button";
import { formatMinutes, formatYear, formatDuration } from "@/lib/format";

function LoadingState({ movie }: { movie?: { thumbnailUrl?: string | null; backdropUrl?: string | null; title?: string } }) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {movie?.backdropUrl || movie?.thumbnailUrl ? (
        <>
          <ShimmerImage
            src={movie.backdropUrl || movie.thumbnailUrl!}
            alt=""
            fill
            imgClassName="object-cover opacity-30"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-black/80" />
        </>
      ) : null}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="size-12 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        {movie?.title && (
          <p className="text-white/50 text-sm font-medium">{movie.title}</p>
        )}
      </div>
    </div>
  );
}

export function WatchContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const { data: movie, isLoading, error, refetch } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: () => moviesApi.getBySlug(params.slug),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    if (error instanceof ApiError && error.code === "not-found") notFound();
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Film className="size-12 text-white/20 mx-auto" />
          <p className="text-white/50 text-sm">Failed to load movie.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 hover:border-white/40 transition-colors"
            >
              <RefreshCw className="size-3" />
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  if (!movie.videoUrl) {
    const durationMin = movie.durationSeconds
      ? formatMinutes(movie.durationSeconds)
      : null;
    const releaseYear = movie.releaseDate
      ? formatYear(movie.releaseDate)
      : null;

    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {movie.backdropUrl || movie.thumbnailUrl ? (
          <>
            <ShimmerImage
              src={movie.backdropUrl || movie.thumbnailUrl || ""}
              alt=""
              fill
              imgClassName="object-cover"
              wrapperClassName="absolute inset-0"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/60" />
          </>
        ) : null}
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <BackButton label={movie.title} />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          {movie.thumbnailUrl ? (
            <div className="relative w-48 aspect-2/3 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <ShimmerImage
                src={movie.thumbnailUrl}
                alt={movie.title}
                fill
                imgClassName="object-cover"
                wrapperClassName="absolute inset-0"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-white/5">
              <Film className="size-10 text-white/30" />
            </div>
          )}
          <div className="max-w-md space-y-3">
            <h1 className="text-2xl font-bold text-white">{movie.title}</h1>
            {(releaseYear || durationMin) && (
              <div className="flex items-center justify-center gap-3 text-white/50 text-xs">
                {releaseYear && <span className="flex items-center gap-1"><Calendar className="size-3" />{releaseYear}</span>}
                {durationMin && <span className="flex items-center gap-1"><Clock className="size-3" />{durationMin} min</span>}
              </div>
            )}
            <p className="text-white/40 text-sm leading-relaxed">
              This movie isn&apos;t available yet. We&apos;re working on adding it — stay tuned!
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/20 active:scale-95"
          >
            <ChevronLeft className="size-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const releaseYear = movie.releaseDate
    ? formatYear(movie.releaseDate)
    : null;

  const metadata = {
    year: releaseYear || undefined,
    duration: formatDuration(movie.durationSeconds) || undefined,
    synopsis: movie.description || undefined,
  };

  return (
    <div className="fixed inset-0 z-60 bg-black select-none overflow-hidden overscroll-none">
      <StreamflixPlayer
        key={movie.videoUrl}
        src={movie.videoUrl}
        poster={movie.backdropUrl || movie.thumbnailUrl || undefined}
        title={movie.title}
        metadata={metadata}
        onBack={() => router.back()}
        className="size-full"
      />
    </div>
  );
}
