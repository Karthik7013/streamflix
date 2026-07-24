"use client";

import { memo, useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useComments, type EnrichedComment } from "@/hooks/use-comments";

const SKELETON_ITEMS_3 = Array.from({ length: 3 }, (_, i) => i);

interface CommentsSectionProps {
  movieSlug: string;
}

const CommentItem = memo(function CommentItem({ comment }: { comment: EnrichedComment }) {
  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
        {comment.user.image ? (
          <Image
            src={comment.user.image}
            alt={comment.user.name}
            width={32}
            height={32}
            sizes="32px"
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
  );
});

export function CommentsSection({ movieSlug }: CommentsSectionProps) {
  const {
    comments,
    total,
    loading,
    isError,
    error,
    retry,
    isFetchingNextPage,
    sentinelRef,
    postMutation,
  } = useComments(movieSlug);

  const [newComment, setNewComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || postMutation.isPending) return;
    postMutation.mutate(newComment.trim());
    setNewComment("");
  }

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

      {loading ? (
        <div className="space-y-4">
          {SKELETON_ITEMS_3.map((i) => (
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
            Unable to load comments.
            {(error as Error)?.message && <span className="block text-xs mt-1 opacity-70">{(error as Error).message}</span>}
          </p>
          <button onClick={() => retry()} className="text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={sentinelRef} className="h-2" />
        </div>
      )}
    </div>
  );
}
