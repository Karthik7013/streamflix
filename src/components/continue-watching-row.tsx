"use client";

import { useMemo } from "react";
import { MediaCarousel } from "@/components/media-carousel";
import { ContinueWatchingCard } from "@/components/continue-watching-card";

import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";

interface WatchProgressItem {
  id: number;
  userId: string;
  movieId: number | null;
  episodeId: number | null;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
  title: string;
  thumbnailUrl: string | null;
  href: string;
}

export function ContinueWatchingRow() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: progressItems = [], isLoading } = useQuery<WatchProgressItem[]>({
    queryKey: ["watch-progress", "list", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch("/api/watch-progress");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: STALE.FAST,
    enabled: !!userId,
  });

  const items = useMemo(() => {
    return progressItems.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      progressPercent: item.durationSeconds > 0 ? (item.progressSeconds / item.durationSeconds) * 100 : 0,
      href: item.href,
    }));
  }, [progressItems]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <MediaCarousel title="Continue Watching">
        {items.map((item) => (
          <ContinueWatchingCard
            key={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            progressPercent={item.progressPercent}
            href={item.href}
          />
        ))}
      </MediaCarousel>
    </section>
  );
}
