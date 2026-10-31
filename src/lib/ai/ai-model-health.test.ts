import { beforeEach, describe, expect, it } from "vitest";
import {
  getAllModelHealth,
  getHealthyModelChain,
  recordModelFailure,
  recordModelSuccess,
  resetModelHealth,
} from "@/lib/ai-model-health";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai-models";

beforeEach(() => {
  resetModelHealth();
});

describe("recordModelFailure", () => {
  it("marks the model unhealthy", () => {
    recordModelFailure(DEFAULT_CHAT_MODEL, "model_unavailable");

    const health = getAllModelHealth().find((h) => h.id === DEFAULT_CHAT_MODEL);

    expect(health?.status).toBe("unhealthy");
    expect(health?.error).toBe("model_unavailable");
  });
});

describe("recordModelSuccess", () => {
  it("marks the model healthy with the observed latency", () => {
    recordModelSuccess(DEFAULT_CHAT_MODEL, 1234);

    const health = getAllModelHealth().find((h) => h.id === DEFAULT_CHAT_MODEL);

    expect(health?.status).toBe("healthy");
    expect(health?.latencyMs).toBe(1234);
    expect(health?.error).toBeNull();
  });
});

describe("getHealthyModelChain", () => {
  it("keeps the primary first when it is healthy", () => {
    const chain = getHealthyModelChain(DEFAULT_CHAT_MODEL);

    expect(chain[0]).toBe(DEFAULT_CHAT_MODEL);
  });

  it("skips a model that failed and moves to the next one", () => {
    recordModelFailure(DEFAULT_CHAT_MODEL, "model_unavailable");

    const chain = getHealthyModelChain(DEFAULT_CHAT_MODEL);

    expect(chain).not.toContain(DEFAULT_CHAT_MODEL);
    expect(chain.length).toBeGreaterThan(0);
  });

  it("keeps models that were never probed", () => {
    const chain = getHealthyModelChain(DEFAULT_CHAT_MODEL);

    expect(chain).toContain(DEFAULT_CHAT_MODEL);
  });

  it("never returns an empty chain", () => {
    for (const model of ["a/b", "c/d", "e/f"]) {
      recordModelFailure(model, "model_unavailable");
    }

    expect(getHealthyModelChain(DEFAULT_CHAT_MODEL).length).toBeGreaterThan(0);
  });

  it("does not fall back to a model outside the allowlist", () => {
    recordModelFailure("nvidia/nemotron-3-super-120b-a12b", "model_unavailable");

    const chain = getHealthyModelChain(DEFAULT_CHAT_MODEL);

    expect(chain).not.toContain("nvidia/nemotron-3-super-120b-a12b");
  });
});
