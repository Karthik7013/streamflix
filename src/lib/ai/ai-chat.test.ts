import { beforeEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "@ai-sdk/provider";

const { streamTextMock } = vi.hoisted(() => ({ streamTextMock: vi.fn() }));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: (...args: unknown[]) => streamTextMock(...args),
  };
});

import { createChatStreamResponse } from "@/lib/ai-chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai-models";
import { getAllModelHealth, resetModelHealth } from "@/lib/ai-model-health";

const USER_MESSAGE = {
  id: "m1",
  role: "user" as const,
  parts: [{ type: "text" as const, text: "hi" }],
};

function deadModelError(message = "Function 'abc' Not found for account 'secret'") {
  return new APICallError({
    message,
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    requestBodyValues: {},
    statusCode: 404,
    isRetryable: false,
  });
}

function fakeResult(chunks: unknown[], error: unknown = new Error("upstream failed")) {
  return {
    toUIMessageStream: (opts?: { onError?: (e: unknown) => string }) =>
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            if ((chunk as { type: string }).type === "error") {
              controller.enqueue({
                type: "error",
                errorText: opts?.onError?.(error) ?? "An error occurred.",
              });
            } else {
              controller.enqueue(chunk);
            }
          }
          controller.close();
        },
      }),
  };
}

function textChunk(text: string) {
  return { type: "text-delta", id: "0", delta: text };
}

function errorChunk() {
  return { type: "error", errorText: "placeholder" };
}

beforeEach(() => {
  process.env.NVIDIA_API_KEY = "test-key";
  streamTextMock.mockReset();
  resetModelHealth();
});

async function readBody(response: Response) {
  return await response.text();
}

describe("createChatStreamResponse", () => {
  it("streams the response from the primary model", async () => {
    streamTextMock.mockReturnValue(
      fakeResult([{ type: "start" }, textChunk("hello"), { type: "finish" }])
    );

    const response = createChatStreamResponse({
      system: "system",
      messages: [USER_MESSAGE],
      tools: {},
      stopWhen: [],
    });
    const body = await readBody(response);

    expect(body).toContain("hello");
    expect(streamTextMock).toHaveBeenCalledTimes(1);
    expect(
      (streamTextMock.mock.calls[0][0] as { model: { modelId: string } }).model
        .modelId
    ).toBe(DEFAULT_CHAT_MODEL);
  });

  it("fails over to the next model when the first one errors before any content", async () => {
    streamTextMock
      .mockReturnValueOnce(fakeResult([{ type: "start" }, errorChunk()], deadModelError()))
      .mockReturnValueOnce(
        fakeResult([{ type: "start" }, textChunk("recovered"), { type: "finish" }])
      );

    const response = createChatStreamResponse({
      system: "system",
      messages: [USER_MESSAGE],
      tools: {},
      stopWhen: [],
    });
    const body = await readBody(response);

    expect(body).toContain("recovered");
    expect(body).not.toContain("secret");
    expect(streamTextMock).toHaveBeenCalledTimes(2);
  });

  it("records the failed model as unhealthy so later requests skip it", async () => {
    streamTextMock
      .mockReturnValueOnce(fakeResult([{ type: "start" }, errorChunk()], deadModelError()))
      .mockReturnValueOnce(fakeResult([{ type: "start" }, textChunk("ok")]));

    await readBody(
      createChatStreamResponse({
        system: "system",
        messages: [USER_MESSAGE],
        tools: {},
        stopWhen: [],
      })
    );

    const failed = getAllModelHealth().find((h) => h.id === DEFAULT_CHAT_MODEL);
    expect(failed?.status).toBe("unhealthy");
    expect(failed?.error).toBe("model_unavailable");
  });

  it("does not fail over once content has been streamed", async () => {
    streamTextMock.mockReturnValue(
      fakeResult(
        [{ type: "start" }, textChunk("partial"), errorChunk()],
        deadModelError()
      )
    );

    const response = createChatStreamResponse({
      system: "system",
      messages: [USER_MESSAGE],
      tools: {},
      stopWhen: [],
    });
    const body = await readBody(response);

    expect(body).toContain("partial");
    expect(streamTextMock).toHaveBeenCalledTimes(1);
  });

  it("returns a friendly message when every model fails", async () => {
    streamTextMock.mockImplementation(() =>
      fakeResult([{ type: "start" }, errorChunk()], deadModelError())
    );

    const response = createChatStreamResponse({
      system: "system",
      messages: [USER_MESSAGE],
      tools: {},
      stopWhen: [],
    });
    const body = await readBody(response);

    expect(body).not.toContain("Function 'abc'");
    expect(body).not.toContain("secret");
    expect(body).toContain("error");
    expect(streamTextMock.mock.calls.length).toBeGreaterThan(1);
  });

  it("applies a timeout so a hanging model cannot stall the request", async () => {
    streamTextMock.mockReturnValue(
      fakeResult([{ type: "start" }, textChunk("ok")])
    );

    await readBody(
      createChatStreamResponse({
        system: "system",
        messages: [USER_MESSAGE],
        tools: {},
        stopWhen: [],
      })
    );

    const options = streamTextMock.mock.calls[0][0] as {
      timeout?: { totalMs?: number; chunkMs?: number };
    };

    expect(options.timeout?.totalMs).toBeGreaterThan(0);
    expect(options.timeout?.chunkMs).toBeGreaterThan(0);
  });

  it("ignores any model supplied by the caller", async () => {
    streamTextMock.mockReturnValue(
      fakeResult([{ type: "start" }, textChunk("ok")])
    );

    await readBody(
      createChatStreamResponse({
        system: "system",
        messages: [USER_MESSAGE],
        tools: {},
        stopWhen: [],
        requestedModel: "some/paid-model",
      })
    );

    const options = streamTextMock.mock.calls[0][0] as {
      model: { modelId: string };
    };

    expect(options.model.modelId).toBe(DEFAULT_CHAT_MODEL);
  });
});
