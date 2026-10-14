"use client";

import { useAdminChat } from "@/hooks/use-admin-chat";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ToolResultCards } from "@/components/ai-elements/tool-result-cards";
import { RefreshCcwIcon, AlertTriangle, XIcon, Loader2 } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { ToolCallIndicator, type ToolPart } from "@/app/(main)/ai/chat-parts";
import { getFriendlyError } from "@/app/(main)/ai/chat-errors";
import Image from "next/image";
import { ADMIN_CHAT_SUGGESTIONS } from "./admin-chat-parts";

export default function AdminAiPage() {
  const {
    input, setInput, errorDismissed, setErrorDismissed,
    messages, sendMessage, status, regenerate, error,
  } = useAdminChat();

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
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-xl flex-col">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Triage, enrich, and analyze your catalog.</p>
      </div>
      <Conversation>
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
                    width={48}
                    height={48}
                    className="size-12"
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

                    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                      const toolPart = part as unknown as ToolPart;
                      const isInProgress = toolPart.state === "input-streaming" || toolPart.state === "input-available";
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
                        const toolName = toolPart.toolName ?? part.type.replace("tool-", "").replace(/-/g, " ");
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
        className="mx-auto w-full p-4"
      >
        <PromptInputTextarea
          className="min-h-10"
          value={input}
          placeholder="Ask about reports, requests, tags, or metrics..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <PromptInputSubmit
          className="mr-1 shrink-0 rounded-md"
          status={status === "streaming" ? "streaming" : "ready"}
          disabled={!input.trim()}
        />
      </PromptInput>
    </div>
  );
}
