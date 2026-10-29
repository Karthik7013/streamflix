"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Bot,
  Loader2,
  RefreshCcwIcon,
  SendHorizontal,
  Sparkles,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useAdminChat } from "@/hooks/use-admin-chat";
import { getFriendlyError } from "@/app/(main)/ai/chat-errors";
import {
  ToolCallIndicator,
  type ToolPart,
} from "@/app/(main)/ai/chat-parts";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";
import { ToolResultCards } from "@/components/ai-elements/tool-result-cards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const ADMIN_CHAT_SUGGESTIONS = [
  "Summarize pending reports",
  "What requests need review?",
  "Signups this week?",
  "Suggest tags for Dune",
  "Look up Dune on TMDB",
];

export function AiAssistantWidget() {
  const {
    input,
    setInput,
    errorDismissed,
    setErrorDismissed,
    messages,
    sendMessage,
    status,
    regenerate,
    stop,
    error,
  } = useAdminChat();

  const [open, setOpen] = useState(false);

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  const handleRetry = () => {
    setErrorDismissed(false);
    regenerate();
  };

  return (
    <Drawer
      showSwipeHandle
      swipeDirection="down"
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger
        render={
          <Button
            variant="default"
            size="icon-lg"
            className={cn(
              "fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 size-14 rounded-full shadow-lg transition-opacity",
              open && "pointer-events-none opacity-0"
            )}
          />
        }
      >
        <Sparkles className="size-6" />
        <span className="sr-only">Open AI assistant</span>
      </DrawerTrigger>
      <DrawerContent className="mx-auto h-full w-full max-w-2xl">
        <DrawerHeader className="pr-12 text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            Studio AI
          </DrawerTitle>
        </DrawerHeader>
        <DrawerClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DrawerClose>
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {error && !errorDismissed && (
              <div className="mx-auto flex max-w-sm items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="flex-1">{getFriendlyError(error)}</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setErrorDismissed(true)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-6">
                <ConversationEmptyState
                  icon={
                    <Image
                      src="/favicon.svg"
                      alt="StreamFlix Studio Logo"
                      width={40}
                      height={40}
                      className="size-10"
                    />
                  }
                  title="Streamflix Studio AI"
                  description="Triage reports, enrich the catalog, or ask about site metrics"
                />
                <Suggestions>
                  {ADMIN_CHAT_SUGGESTIONS.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      suggestion={suggestion}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </Suggestions>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message, messageIndex) => (
                  <Fragment key={message.id}>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <MessageResponse>{part.text}</MessageResponse>
                              </MessageContent>
                            </Message>
                            {message.role === "assistant" &&
                              messageIndex === messages.length - 1 && (
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

                      if (
                        part.type.startsWith("tool-") ||
                        part.type === "dynamic-tool"
                      ) {
                        const toolPart = part as unknown as ToolPart;
                        const isInProgress =
                          toolPart.state === "input-streaming" ||
                          toolPart.state === "input-available";
                        const isError = toolPart.state === "output-error";

                        if (isInProgress || isError) {
                          return (
                            <ToolCallIndicator
                              key={`${message.id}-${i}`}
                              part={toolPart}
                            />
                          );
                        }

                        if (toolPart.state === "output-available") {
                          const toolName =
                            toolPart.toolName ??
                            part.type.replace("tool-", "").replace(/-/g, " ");
                          return (
                            <ToolResultCards
                              key={`${message.id}-${i}`}
                              toolName={toolName}
                              output={toolPart.output}
                            />
                          );
                        }

                        return null;
                      }

                      return null;
                    })}
                  </Fragment>
                ))}
                {status === "submitted" && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput
          onSubmit={handleSubmit}
          className="mx-3 mb-3 w-auto shrink-0 [&>[data-slot=input-group]]:rounded-4xl"
        >
          <PromptInputTextarea
            className="min-h-10"
            value={input}
            placeholder="Ask about reports, requests, tags, or metrics..."
            onChange={(e) => setInput(e.currentTarget.value)}
          />
          <PromptInputSubmit
            className="rounded-full"
            status={status}
            onStop={stop}
            disabled={!input.trim()}
          >
            {status === "streaming" ? (
              <SquareIcon className="size-4" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </PromptInputSubmit>
        </PromptInput>
      </DrawerContent>
    </Drawer>
  );
}
