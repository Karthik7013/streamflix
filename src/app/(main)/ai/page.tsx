"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
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
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ModelSelectorLogo, ModelSelectorName } from "@/components/ai-elements/model-selector";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ToolResultCards } from "@/components/ai-elements/tool-result-cards";
import { Sparkles, CopyIcon, RefreshCcwIcon, AlertTriangle, XIcon, BrainCircuit, Loader2 } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { MODEL_GROUPS, ToolCallIndicator, ReasoningIndicator, type ToolPart } from "./chat-parts";

function getFriendlyError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Too many requests — please wait a moment and try again.";
  }
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("unavailable")) {
    return "Model is overloaded — try a different model or try again later.";
  }
  if (msg.includes("500") || msg.includes("internal")) {
    return "Server error — please try again.";
  }
  if (msg.includes("timeout") || msg.includes("deadline")) {
    return "Request timed out — try a simpler question.";
  }
  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) {
    return "API key issue — please contact support.";
  }
  return err.message;
}

const SUGGESTIONS = [
  "What's trending on StreamFlix right now?",
  "Show me some action movies",
  "What genres are available?",
  "Recommend a good sci-fi movie",
];

export default function AiPage() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash-lite");
  const [provider, setProvider] = useState("google");
  const [modelOpen, setModelOpen] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const { messages, sendMessage, status, regenerate, error } = useChat();

  const selectedModel = MODEL_GROUPS
    .find((g) => g.provider === provider)
    ?.models.find((m) => m.id === model);

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage(
        { text: message.text },
        { body: { model, provider } }
      );
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(
      { text: suggestion },
      { body: { model, provider } }
    );
  };

  const handleRetry = () => {
    setErrorDismissed(false);
    regenerate();
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-xl flex-col">
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
                icon={<Sparkles className="size-12" />}
                title="StreamFlix AI Assistant"
                description="Ask me about movies, series, or anything related to StreamFlix"
              />
              <Suggestions>
                {SUGGESTIONS.map((suggestion) => (
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
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                        </Fragment>
                      );
                    }

                    if (part.type === "reasoning") {
                      return (
                        <ReasoningIndicator
                          key={`${message.id}-${i}`}
                          text={part.text}
                          state={part.state}
                        />
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
                      return null;
                    }

                    return null;
                  })}
                  {(() => {
                    const completedTools = message.parts.filter(
                      (p) =>
                        (p.type.startsWith("tool-") || p.type === "dynamic-tool") &&
                        (p as unknown as ToolPart).state === "output-available"
                    );
                    if (completedTools.length === 0) return null;
                    return completedTools.map((p, ti) => {
                      const tp = p as unknown as ToolPart;
                      const toolName = tp.toolName ?? tp.type.replace("tool-", "").replace(/-/g, " ");
                      return (
                        <ToolResultCards
                          key={`${message.id}-result-${ti}`}
                          toolName={toolName}
                          output={tp.output}
                        />
                      );
                    });
                  })()}
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

      <CommandDialog open={modelOpen} onOpenChange={setModelOpen}>
        <CommandInput placeholder="Search models..." />
        <CommandList>
          <CommandEmpty>No models found.</CommandEmpty>
          {MODEL_GROUPS.map((group) => (
            <CommandGroup key={group.name} heading={group.name}>
              {group.models.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => {
                    setModel(m.id);
                    setProvider(group.provider);
                    setModelOpen(false);
                  }}
                >
                  <ModelSelectorLogo provider={group.provider} />
                  <ModelSelectorName>{m.name}</ModelSelectorName>
                  <span className="ml-auto text-xs text-muted-foreground">{m.tier}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <PromptInput
        onSubmit={handleSubmit}
        className="mx-auto w-full p-4"
      >
        <PromptInputTextarea
          value={input}
          placeholder="Ask about movies, series, or anything..."
          onChange={(e) => setInput(e.currentTarget.value)}
          className="pr-12"
        />
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              onClick={() => setModelOpen(true)}
              className="shrink-0 gap-1.5"
              variant="outline"
            >
              <BrainCircuit className="size-4" />
              <span className="text-xs font-medium truncate max-w-[80px]">
                {selectedModel?.name ?? "Model"}
              </span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit
            status={status === "streaming" ? "streaming" : "ready"}
            disabled={!input.trim()}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
