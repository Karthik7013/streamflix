"use client";

import { useMemo, useRef, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STALE } from "@/lib/stale-times";
import { moviesApi } from "@/lib/api/movies";

const LIMIT = 10;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export interface EnrichedComment {
  id: number;
  content: string;
  createdAt: string;
  timeAgo: string;
  user: { name: string; image: string | null };
}

export function useComments(movieSlug: string) {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const query = useInfiniteQuery({
    queryKey: ["comments", movieSlug],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      return moviesApi.getComments(movieSlug, params);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: STALE.FAST,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, query]);

  const postMutation = useMutation({
    mutationFn: (content: string) => moviesApi.postComment(movieSlug, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", movieSlug] });
      toast.success("Comment posted.");
    },
    onError: () => {
      toast.error("Unable to post comment. Please try again.");
    },
  });

  const allComments = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data?.pages],
  );

  const enriched = useMemo(
    () => allComments.map((c) => ({ ...c, timeAgo: timeAgo(c.createdAt) })),
    [allComments],
  ) as EnrichedComment[];

  const total = query.data?.pages[0]?.meta?.total ?? 0;

  return {
    comments: enriched,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetchingNextPage: query.isFetchingNextPage,
    sentinelRef,
    postMutation,
  };
}
