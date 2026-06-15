"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WatchContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${params.slug}`);
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("fetch-failed");
      return res.json();
    },
    retry: false,
  });

  const saveProgress = useMutation({
    mutationFn: async (pct: number) => {
      await fetch(`/api/movies/${params.slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressSeconds: Math.round(pct) }),
      });
    },
  });

  useEffect(() => {
    if (!hasInteracted || !movie) return;
    const id = setInterval(() => {
      saveProgress.mutate(progress);
    }, 30000);
    return () => clearInterval(id);
  }, [hasInteracted, movie, progress, saveProgress]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    setProgress(pct);
    setHasInteracted(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    videoRef.current?.play();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="w-full max-w-4xl aspect-video rounded-lg" />
      </div>
    );
  }

  if (error) {
    if (error.message === "not-found") {
      notFound();
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Failed to load movie.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      {/* Back button overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-6" />
          <span className="text-sm font-medium">{movie.title}</span>
        </button>
      </div>

      {/* Video player */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          ref={videoRef}
          src={movie.videoUrl}
          className="max-h-full w-full rounded-lg shadow-2xl"
          onTimeUpdate={handleTimeUpdate}
          onCanPlay={handleCanPlay}
          controls
          playsInline
        />
      </div>
    </div>
  );
}
