import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type StopCondition,
  type ToolSet,
  type UIMessage,
} from "ai";
import { nvidia } from "@/lib/ai-gateway";
import { aiErrorMessage, classifyAiError, type AiErrorKind } from "@/lib/ai-errors";
import { getHealthyModelChain, recordModelFailure } from "@/lib/ai-model-health";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai-models";
import { logger } from "@/lib/logger";

export const AI_CHAT_TOTAL_TIMEOUT_MS = 90_000;
export const AI_CHAT_CHUNK_TIMEOUT_MS = 45_000;
export const AI_CHAT_OVERALL_TIMEOUT_MS = 110_000;

export interface ChatStreamOptions<Tools extends ToolSet = ToolSet> {
  system: string;
  messages: UIMessage[];
  tools: Tools;
  stopWhen: StopCondition<Tools>[];
  requestedModel?: string;
  overallTimeoutMs?: number;
}

export function createChatStreamResponse<Tools extends ToolSet = ToolSet>(
  options: ChatStreamOptions<Tools>
): Response {
  const deadline = Date.now() + (options.overallTimeoutMs ?? AI_CHAT_OVERALL_TIMEOUT_MS);
  const chain = getHealthyModelChain(
    options.requestedModel ?? DEFAULT_CHAT_MODEL
  );

  const stream = createUIMessageStream({
    onError: (error) => {
      const kind = classifyAiError(error);
      logger.error("ai-chat", "Chat stream failed", error);
      return aiErrorMessage(kind);
    },
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(options.messages);
      let wroteStart = false;
      let lastKind: AiErrorKind = "unknown";

      for (const model of chain) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;

        let failureKind: AiErrorKind | null = null;

        const result = streamText({
          model: nvidia.languageModel(model),
          system: options.system,
          messages: modelMessages,
          tools: options.tools,
          stopWhen: options.stopWhen,
          timeout: {
            totalMs: Math.min(remaining, AI_CHAT_TOTAL_TIMEOUT_MS),
            chunkMs: AI_CHAT_CHUNK_TIMEOUT_MS,
          },
          maxRetries: 1,
        });

        const chunkStream = result.toUIMessageStream({
          onError: (error) => {
            const kind = classifyAiError(error);
            failureKind = kind;
            lastKind = kind;
            logger.error("ai-chat", `Model ${model} failed`, error);
            recordModelFailure(model, kind);
            return aiErrorMessage(kind);
          },
        });

        const reader = chunkStream.getReader();
        let producedContent = false;
        let failed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value.type === "error") {
            failed = true;
            break;
          }

          if (value.type === "start") {
            if (wroteStart) continue;
            wroteStart = true;
          } else {
            producedContent = true;
          }

          writer.write(value);
        }

        if (!failed) return;

        if (producedContent) {
          writer.write({
            type: "error",
            errorText: aiErrorMessage(failureKind ?? "unknown"),
          });
          return;
        }
      }

      writer.write({ type: "error", errorText: aiErrorMessage(lastKind) });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
