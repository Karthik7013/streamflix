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
      <section>
        <div className="flex items-center justify-between mb-4 px-4 md:px-8 lg:px-12">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-3 overflow-hidden py-4 px-4 md:px-8 lg:px-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-44 shrink-0 space-y-2">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-4 md:px-8 lg:px-12">
        <h2 className="text-lg font-semibold font-heading flex items-center gap-2">
          Continue Watching
        </h2>
      </div>
      <MediaCarousel
        className="px-4 md:px-8 lg:px-12 py-4"
        slideClassName="shrink-0 grow-0 basis-auto pl-3"
      >
        {items.map((item) => (
          <div key={item.id} className="group relative w-44">
            <ContinueWatchingCard
              title={item.title}
              thumbnailUrl={item.thumbnailUrl}
              progressPercent={item.progressPercent}
              href={item.href}
            />
          </div>
        ))}
      </MediaCarousel>
    </section>
  );
}
