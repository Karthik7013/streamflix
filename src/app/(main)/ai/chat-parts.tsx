"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Wrench, ChevronDown, ChevronRight } from "lucide-react";

export type ToolPart = {
  type: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error";
  toolName?: string;
  output?: unknown;
  text?: string;
};

export function ToolCallIndicator({
  part,
}: {
  part: { type: string; state?: string; toolName?: string; toolCallId?: string; input?: unknown; output?: unknown; errorText?: string };
}) {
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
        {(hasInput || hasOutput) && (expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />)}
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
                {typeof part.output === "string" ? part.output : JSON.stringify(part.output).slice(0, 200)}
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
