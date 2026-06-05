"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchMovie(slug: string) {
  const res = await fetch(`/api/movies/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch movie");
  return res.json();
}

async function toggleFavorite(movieId: number) {
  const res = await fetch("/api/favorites/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movieId }),
  });
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json();
}

async function saveProgress(
  slug: string,
  progressSeconds: number,
  isCompleted: boolean
) {
  await fetch(`/api/movies/${slug}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progressSeconds, isCompleted }),
  });
}

export function MovieDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<number>(0);

  const {
    data: movie,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: () => fetchMovie(params.slug),
  });

  const favMutation = useMutation({
    mutationFn: () => toggleFavorite(movie.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", params.slug] });
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movie) return;

    const handleTimeUpdate = () => {
      progressRef.current = Math.floor(video.currentTime);
    };

    const handlePause = () => {
      const isEnded = video.ended;
      saveProgress(slug, progressRef.current, isEnded);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);

    const interval = setInterval(() => {
      if (progressRef.current > 0) {
        saveProgress(slug, progressRef.current, false);
      }
    }, 30000);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      clearInterval(interval);
      if (progressRef.current > 0) {
        saveProgress(slug, progressRef.current, false);
      }
    };
  }, [movie]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4">
        <Skeleton className="aspect-video rounded-lg max-w-4xl" />
        <Skeleton className="h-8 w-64 mt-4" />
        <Skeleton className="h-4 w-full mt-2" />
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-center py-12">
          Movie not found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{movie.title}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => favMutation.mutate()}
          disabled={favMutation.isPending}
        >
          <Heart
            className={
              movie.isFavorited ? "fill-red-500 text-red-500" : ""
            }
          />
        </Button>
      </header>
      <div className="flex-1 p-4 space-y-6 max-w-4xl">
        <video
          ref={videoRef}
          src={movie.videoUrl}
          controls
          className="w-full rounded-lg"
          poster={movie.thumbnailUrl}
        />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{movie.title}</h1>
            {movie.releaseDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(movie.releaseDate).getFullYear()}
              </p>
            )}
          </div>
        </div>
        {movie.description && (
          <p className="text-muted-foreground">{movie.description}</p>
        )}
      </div>
    </div>
  );
}
