import {
  APICallError,
  LoadAPIKeyError,
  NoContentGeneratedError,
} from "@ai-sdk/provider";

export type AiErrorKind =
  | "model_unavailable"
  | "model_rate_limited"
  | "model_overloaded"
  | "model_timeout"
  | "provider_auth"
  | "model_empty"
  | "unknown";

export const AI_ERROR_CODES: Record<AiErrorKind, string> = {
  model_unavailable: "AI_MODEL_UNAVAILABLE",
  model_rate_limited: "AI_MODEL_RATE_LIMITED",
  model_overloaded: "AI_MODEL_OVERLOADED",
  model_timeout: "AI_MODEL_TIMEOUT",
  provider_auth: "AI_PROVIDER_AUTH",
  model_empty: "AI_MODEL_EMPTY",
  unknown: "AI_UNKNOWN",
};

export const AI_ERROR_MESSAGES: Record<AiErrorKind, string> = {
  model_unavailable:
    "This AI model is no longer available. Please ask an admin to switch it.",
  model_rate_limited:
    "The AI model is busy right now. Please try again in a moment.",
  model_overloaded:
    "The AI model is temporarily overloaded. Please try again.",
  model_timeout: "The AI took too long to respond. Please try again.",
  provider_auth:
    "The AI service is not configured correctly. Please contact support.",
  model_empty: "The AI returned an empty response. Please try again.",
  unknown: "Something went wrong. Please try again.",
};

export function aiErrorMessage(kind: AiErrorKind): string {
  return AI_ERROR_MESSAGES[kind];
}

function isAbortLike(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || error.name === "TimeoutError";
}

export function classifyAiError(error: unknown): AiErrorKind {
  if (NoContentGeneratedError.isInstance(error)) return "model_empty";
  if (LoadAPIKeyError.isInstance(error)) return "provider_auth";

  if (APICallError.isInstance(error)) {
    const status = error.statusCode;
    if (status === 404 || status === 410) return "model_unavailable";
    if (status === 429) return "model_rate_limited";
    if (status === 401 || status === 403) return "provider_auth";
    if (status !== undefined && status >= 500) return "model_overloaded";
    if (isAbortLike(error.cause)) return "model_timeout";
    return "unknown";
  }

  if (isAbortLike(error)) return "model_timeout";

  return "unknown";
}
