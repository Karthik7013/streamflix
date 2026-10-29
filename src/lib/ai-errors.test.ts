import { describe, expect, it } from "vitest";
import { APICallError, LoadAPIKeyError, NoContentGeneratedError } from "@ai-sdk/provider";
import {
  AI_ERROR_CODES,
  AI_ERROR_MESSAGES,
  aiErrorMessage,
  classifyAiError,
} from "@/lib/ai-errors";

function apiCallError(statusCode: number, message = "upstream failed") {
  return new APICallError({
    message,
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    requestBodyValues: {},
    statusCode,
    isRetryable: false,
  });
}

describe("classifyAiError", () => {
  it("treats 404 as an unavailable model", () => {
    expect(classifyAiError(apiCallError(404))).toBe("model_unavailable");
  });

  it("treats 410 as an unavailable model", () => {
    expect(classifyAiError(apiCallError(410, "end of life"))).toBe(
      "model_unavailable"
    );
  });

  it("treats 429 as a rate limit", () => {
    expect(classifyAiError(apiCallError(429))).toBe("model_rate_limited");
  });

  it("treats 5xx as an overloaded provider", () => {
    expect(classifyAiError(apiCallError(500))).toBe("model_overloaded");
    expect(classifyAiError(apiCallError(503))).toBe("model_overloaded");
  });

  it("treats 401 and 403 as a provider auth problem", () => {
    expect(classifyAiError(apiCallError(401))).toBe("provider_auth");
    expect(classifyAiError(apiCallError(403))).toBe("provider_auth");
  });

  it("treats a missing api key as a provider auth problem", () => {
    expect(
      classifyAiError(new LoadAPIKeyError({ message: "No API key provided" }))
    ).toBe("provider_auth");
  });

  it("treats an empty generation as an empty model response", () => {
    expect(classifyAiError(new NoContentGeneratedError())).toBe("model_empty");
  });

  it("treats an aborted request as a timeout", () => {
    const aborted = new Error("The operation was aborted");
    aborted.name = "AbortError";
    expect(classifyAiError(aborted)).toBe("model_timeout");
  });

  it("treats a timeout exception as a timeout", () => {
    const timedOut = new Error("total timeout of 90000ms exceeded");
    timedOut.name = "TimeoutError";
    expect(classifyAiError(timedOut)).toBe("model_timeout");
  });

  it("falls back to unknown for anything else", () => {
    expect(classifyAiError(new Error("boom"))).toBe("unknown");
    expect(classifyAiError(undefined)).toBe("unknown");
    expect(classifyAiError("nope")).toBe("unknown");
  });
});

describe("AI_ERROR_MESSAGES", () => {
  it("never leaks upstream text", () => {
    const leaky = apiCallError(
      404,
      "Function 'ac74040f' Not found for account 'MRhW7xzQsUYawms'"
    );

    const message = aiErrorMessage(classifyAiError(leaky));

    expect(message).not.toContain("ac74040f");
    expect(message).not.toContain("MRhW7xzQsUYawms");
    expect(message).toBe(AI_ERROR_MESSAGES.model_unavailable);
  });

  it("gives every kind a distinct message and code", () => {
    const kinds = Object.keys(AI_ERROR_MESSAGES) as (keyof typeof AI_ERROR_MESSAGES)[];

    expect(new Set(kinds.map((k) => AI_ERROR_MESSAGES[k])).size).toBe(kinds.length);
    expect(new Set(kinds.map((k) => AI_ERROR_CODES[k])).size).toBe(kinds.length);
  });
});
