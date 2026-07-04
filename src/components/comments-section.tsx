"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { STALE } from "@/lib/stale-times";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsSectionProps {
  movieSlug: string;
}

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

export function CommentsSection({ movieSlug }: CommentsSectionProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["comments", movieSlug, page],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${movieSlug}/comments?page=${page}&limit=20`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      return res.json() as Promise<{
        comments: Comment[];
        total: number;
        page: number;
        hasMore: boolean;
      }>;
    },
    staleTime: STALE.FAST,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/movies/${movieSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      setNewComment("");
      setPage(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["comments", movieSlug, 1], (old: any) => {
        if (!old) return { comments: [data.comment], total: 1, page: 1, hasMore: false };
        return { ...old, comments: [data.comment, ...old.comments], total: old.total + 1 };
      });
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || postMutation.isPending) return;
    postMutation.mutate(newComment.trim());
  }

  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const enrichedComments = useMemo(
    () => (data?.comments ?? []).map((c) => ({ ...c, timeAgo: timeAgo(c.createdAt) })),
    [data?.comments]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Comments</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">({total})</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
          maxLength={500}
          rows={1}
          disabled={postMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || postMutation.isPending}
          className="self-end rounded-lg bg-primary p-2.5 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {postMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Failed to load comments
            {(error as Error)?.message && <span className="block text-xs mt-1 opacity-70">{(error as Error).message}</span>}
          </p>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      ) : enrichedComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {enrichedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={32}
                    height={32}
                    className="object-cover size-full"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{comment.timeAgo}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-primary hover:underline"
              >
                Load more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
