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
import { Sparkles, CopyIcon, RefreshCcwIcon, AlertTriangle, XIcon, BrainCircuit } from "lucide-react";
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
      { id: "nemotron-3-ultra-550b-a55b", name: "Nemotron Ultra 550B", tier: "Advanced" },
      { id: "nemotron-3-super-120b-a12b", name: "Nemotron Super 120B", tier: "Advanced" },
      { id: "deepseek-v4-pro-0813", name: "DeepSeek V4 Pro", tier: "Advanced" },
      { id: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash", tier: "Fast" },
      { id: "gemma-4-31b-it", name: "Gemma 4 31B", tier: "Fast" },
      { id: "step-3.7-flash", name: "Step 3.7 Flash", tier: "Fast" },
      { id: "minimax-m3", name: "MiniMax M3", tier: "Fast" },
      { id: "nemotron-3.5-lightning-30b-a3b", name: "Nemotron Lightning 30B", tier: "Fast" },
      { id: "muse-glimmer-30b", name: "Muse Glimmer 30B", tier: "Fast" },
      { id: "laguna-xs-2.1", name: "Laguna XS 2.1", tier: "Free" },
      { id: "nemotron-3-nano-30b-a3b", name: "Nemotron Nano 30B", tier: "Free" },
      { id: "nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron Nano Omni 30B", tier: "Reasoning" },
      { id: "cosmos3-nano", name: "Cosmos3 Nano", tier: "Free" },
      { id: "cosmos3-nano-reasoner", name: "Cosmos3 Nano Reasoner", tier: "Reasoning" },
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
            messages.map((message, messageIndex) => (
              <Fragment key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
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
                    default:
                      return null;
                  }
                })}
              </Fragment>
            ))
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
