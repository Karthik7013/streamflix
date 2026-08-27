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
import { Sparkles, CopyIcon, RefreshCcwIcon, AlertTriangle, XIcon, BrainCircuit, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight, Wrench, Brain } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";

const MODEL_GROUPS = [
  {
    name: "Google",
    provider: "google",
    models: [
      { id: "gemini-2.5-flash-lite", name: "2.5 Flash Lite", tier: "Free" },
      { id: "gemini-2.5-flash", name: "2.5 Flash", tier: "Fast" },
      { id: "gemini-2.5-pro", name: "2.5 Pro", tier: "Advanced" },
      { id: "gemini-2.0-flash", name: "2.0 Flash", tier: "Fast" },
      { id: "gemini-1.5-flash", name: "1.5 Flash", tier: "Free" },
      { id: "gemini-1.5-pro", name: "1.5 Pro", tier: "Advanced" },
    ],
  },
  {
    name: "NVIDIA",
    provider: "nvidia",
    models: [
      { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron Ultra 550B", tier: "Advanced" },
      { id: "deepseek-ai/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro", tier: "Advanced" },
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", tier: "Fast" },
      { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron Lightning 30B", tier: "Free" },
    ],
  },
];

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

function ToolCallIndicator({ part }: { part: { type: string; state?: string; toolName?: string; toolCallId: string; input?: unknown; output?: unknown; errorText?: string } }) {
  const [expanded, setExpanded] = useState(false);
  const toolName = (part as { toolName?: string }).toolName ?? part.type.replace("tool-", "").replace(/-/g, " ");
  const isRunning = part.state === "input-streaming" || part.state === "input-available";
  const isDone = part.state === "output-available";
  const isError = part.state === "output-error";
  const hasInput = part.input != null;
  const hasOutput = part.output != null;

  const displayName = toolName
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="my-1 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left text-muted-foreground"
      >
        {isRunning && <Loader2 className="size-3 shrink-0 animate-spin text-blue-500" />}
        {isDone && <CheckCircle2 className="size-3 shrink-0 text-green-500" />}
        {isError && <XCircle className="size-3 shrink-0 text-red-500" />}
        {!isRunning && !isDone && !isError && <Wrench className="size-3 shrink-0" />}
        <span className="flex-1">
          {isRunning && `Calling ${displayName}...`}
          {isDone && `Called ${displayName}`}
          {isError && `Failed: ${displayName}`}
          {!isRunning && !isDone && !isError && displayName}
        </span>
        {(hasInput || hasOutput) && (
          expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
          {hasInput && (
            <div>
              <span className="font-medium text-muted-foreground">Input: </span>
              <code className="break-all text-[11px]">{JSON.stringify(part.input)}</code>
            </div>
          )}
          {isDone && hasOutput && (
            <div>
              <span className="font-medium text-muted-foreground">Output: </span>
              <code className="break-all text-[11px]">
                {typeof part.output === "string"
                  ? part.output
                  : JSON.stringify(part.output).slice(0, 200)}
              </code>
            </div>
          )}
          {isError && part.errorText && (
            <div className="text-red-500">
              <span className="font-medium">Error: </span>
              <code className="break-all text-[11px]">{part.errorText}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningIndicator({ text, state }: { text: string; state?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isStreaming = state === "streaming";

  return (
    <div className="my-1 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left text-muted-foreground"
      >
        {isStreaming ? (
          <Loader2 className="size-3 shrink-0 animate-spin text-purple-500" />
        ) : (
          <Brain className="size-3 shrink-0 text-purple-500" />
        )}
        <span className="flex-1">
          {isStreaming ? "Thinking..." : "Thought process"}
        </span>
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      {expanded && text && (
        <div className="mt-2 border-t border-border/30 pt-2 text-muted-foreground whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
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
                      return (
                        <ToolCallIndicator
                          key={`${message.id}-${i}`}
                          part={part as any}
                        />
                      );
                    }

                    return null;
                  })}
                </Fragment>
              ))}
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
