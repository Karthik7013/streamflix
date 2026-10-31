import { describe, expect, it } from "vitest";
import {
  AI_MODELS,
  DEFAULT_CHAT_MODEL,
  getModelChain,
  getModelOption,
  isAllowedModel,
} from "@/lib/ai-models";

describe("AI_MODELS allowlist", () => {
  it("only contains free models that are callable on the NVIDIA free endpoint", () => {
    expect(AI_MODELS.length).toBeGreaterThan(0);

    for (const model of AI_MODELS) {
      expect(model.id).toMatch(/^[a-z0-9-]+\/[a-z0-9.\-]+$/);
      expect(model.label.length).toBeGreaterThan(0);
    }
  });

  it("never includes models that are retired or not callable", () => {
    const ids = AI_MODELS.map((m) => m.id);

    expect(ids).not.toContain("openai/gpt-oss-20b");
    expect(ids).not.toContain("nvidia/nemotron-3-nano-30b-a3b");
    expect(ids).not.toContain("nvidia/nemotron-3-super-120b-a12b");
    expect(ids).not.toContain("meta/llama-3.1-nemotron-70b-instruct");
    expect(ids).not.toContain("mistralai/mistral-large-2-instruct");
    expect(ids).not.toContain("moonshotai/kimi-k2.6");
  });

  it("has no duplicate ids", () => {
    const ids = AI_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("DEFAULT_CHAT_MODEL", () => {
  it("is part of the allowlist", () => {
    expect(isAllowedModel(DEFAULT_CHAT_MODEL)).toBe(true);
  });
});

describe("isAllowedModel", () => {
  it("accepts allowlisted models", () => {
    expect(isAllowedModel(DEFAULT_CHAT_MODEL)).toBe(true);
  });

  it("rejects models outside the allowlist", () => {
    expect(isAllowedModel("nvidia/nemotron-3-super-120b-a12b")).toBe(false);
    expect(isAllowedModel("openai/gpt-oss-20b")).toBe(false);
    expect(isAllowedModel("")).toBe(false);
  });
});

describe("getModelOption", () => {
  it("returns metadata for an allowlisted model", () => {
    expect(getModelOption(DEFAULT_CHAT_MODEL)?.label).toBeTruthy();
  });

  it("returns undefined for an unknown model", () => {
    expect(getModelOption("nope/nope")).toBeUndefined();
  });
});

describe("getModelChain", () => {
  it("puts the primary model first", () => {
    const chain = getModelChain("nvidia/nemotron-3.5-lightning-30b-a3b");

    expect(chain[0]).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
  });

  it("keeps every allowlisted model in the chain exactly once", () => {
    const chain = getModelChain(DEFAULT_CHAT_MODEL);

    expect(chain).toHaveLength(AI_MODELS.length);
    expect(new Set(chain).size).toBe(chain.length);
    expect(chain).toEqual(expect.arrayContaining(AI_MODELS.map((m) => m.id)));
  });

  it("falls back to the default when the primary is not allowlisted", () => {
    const chain = getModelChain("some/paid-model");

    expect(chain[0]).toBe(DEFAULT_CHAT_MODEL);
    expect(chain).not.toContain("some/paid-model");
  });

  it("does not duplicate the primary when it is also the default", () => {
    const chain = getModelChain(DEFAULT_CHAT_MODEL);

    expect(chain.filter((id) => id === DEFAULT_CHAT_MODEL)).toHaveLength(1);
  });
});
