"use client";

import { Fragment, memo, useCallback, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  AlertTriangle,
  Loader2,
  RefreshCcwIcon,
  Sparkles,
  XIcon,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { MovieCard } from "@/components/movie/movie-card";
import { Button } from "@/components/ui/button";
import { ToolCallIndicator, type ToolPart } from "@/app/(main)/ai/chat-parts";
import { getFriendlyError } from "@/app/(main)/ai/chat-errors";
import { useComments } from "@/hooks/use-comments";
import { buildAskSuggestions } from "./ask-about-movie-suggestions";
import type { MovieDetail } from "@/types";

interface SimilarMovie {
  title: string;
  slug: string;
  thumbnailUrl: string;
  description: string;
}

const SimilarMoviesRow = memo(function SimilarMoviesRow({
  movies,
}: {
  movies: SimilarMovie[];
}) {
  return (
    <div className="my-2 flex snap-x gap-3 overflow-x-auto pb-1">
      {movies.map((movie) => (
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
});

const ReviewsNote = memo(function ReviewsNote({ count }: { count: number }) {
  return (
    <p className="my-1 text-xs text-muted-foreground">
      Read {count} viewer {count === 1 ? "review" : "reviews"}
    </p>
  );
});

export function AskAboutMovie({ movie }: { movie: MovieDetail }) {
  const [input, setInput] = useState("");
  const [errorDismissed, setErrorDismissed] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: `/api/movies/${movie.slug}/chat` }),
    [movie.slug]
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    setMessages,
    stop,
  } = useChat({
    id: `movie-ask-${movie.slug}`,
    transport,
  });

  const { total: reviewCount } = useComments(movie.slug);

  const suggestions = useMemo(
    () => buildAskSuggestions(movie, reviewCount),
    [movie, reviewCount]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim()) return;
      setMessages([]);
      sendMessage({ text: message.text });
      setInput("");
    },
    [sendMessage, setMessages]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setMessages([]);
      sendMessage({ text: suggestion });
    },
    [sendMessage, setMessages]
  );

  const handleRetry = useCallback(() => {
    setErrorDismissed(false);
    regenerate();
  }, [regenerate]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setInput("");
    setErrorDismissed(false);
  }, [setMessages]);

  const renderToolPart = (part: ToolPart) => {
    const isInProgress =
      part.state === "input-streaming" || part.state === "input-available";
    const isError = part.state === "output-error";

    if (isInProgress || isError) {
      return <ToolCallIndicator part={part} />;
    }

    if (part.state === "output-available") {
      const toolName =
        part.toolName ?? part.type.replace("tool-", "").replace(/-/g, " ");

      if (toolName === "getSimilarMovies") {
        const output = part.output as { movies?: SimilarMovie[] } | undefined;
        const similar = output?.movies ?? [];
        if (similar.length === 0) return null;
        return <SimilarMoviesRow movies={similar} />;
      }

      if (toolName === "getMovieReviews") {
        const output = part.output as { reviews?: unknown[] } | undefined;
        const count = output?.reviews?.length ?? 0;
        if (count === 0) return null;
        return <ReviewsNote count={count} />;
      }
    }

    return null;
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="text-base font-semibold">Ask about this movie</h2>
        {/* Temporary launch badge — remove once the feature is no longer new. */}
        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
          New!
        </span>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        className="mt-3 w-auto shrink-0 [&>[data-slot=input-group]]:rounded-xl"
      >
        <PromptInputTextarea
          className="min-h-10 resize-none"
          value={input}
          placeholder="Ask a question about this movie"
          aria-label="Ask a question about this movie"
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <PromptInputSubmit
          className="mr-1 shrink-0 rounded-md"
          status={status}
          onStop={stop}
          disabled={!input.trim()}
        />
      </PromptInput>

      {messages.length === 0 && suggestions.length > 0 && (
        <Suggestions className="mt-3 flex-nowrap overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              suggestion={suggestion}
              onClick={handleSuggestionClick}
            />
          ))}
        </Suggestions>
      )}

      {error && !errorDismissed && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <p className="flex-1">{getFriendlyError(error)}</p>
          <Button variant="ghost" size="icon-sm" onClick={() => setErrorDismissed(true)}>
            <XIcon className="size-3" />
          </Button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-3 flex max-h-[26rem] flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="gap-3 p-0">
              {messages.map((message, messageIndex) => (
                <Fragment key={message.id}>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      if (message.role === "assistant" && status === "submitted") {
                        return null;
                      }
                      return (
                        <Fragment key={`${message.id}-${index}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" &&
                            messageIndex === messages.length - 1 &&
                            status !== "submitted" && (
                            <MessageActions>
                              <MessageAction
                                onClick={handleRetry}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Fragment>
                      );
                    }

                    if (part.type === "step-start") {
                      return null;
                    }

                    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                      return (
                        <Fragment key={`${message.id}-${index}`}>
                          {renderToolPart(part as unknown as ToolPart)}
                        </Fragment>
                      );
                    }

                    return null;
                  })}
                </Fragment>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          {status === "submitted" && (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
