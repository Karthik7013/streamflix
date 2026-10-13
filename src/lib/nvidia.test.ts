import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nvidiaEmbed, EMBEDDING_DIMENSIONS } from "@/lib/nvidia";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.NVIDIA_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(vector: number[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: [{ embedding: vector }] }),
  };
}

describe("nvidiaEmbed", () => {
  it("sends input_type=query for search queries", async () => {
    fetchMock.mockResolvedValueOnce(okResponse([0.1, 0.2]));

    const [vec] = await nvidiaEmbed(["How do I file a DMCA notice?"], "query");

    expect(vec).toEqual([0.1, 0.2]);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.input_type).toBe("query");
    expect(body.dimensions).toBe(EMBEDDING_DIMENSIONS);
  });

  it("sends input_type=passage for indexed documents", async () => {
    fetchMock.mockResolvedValueOnce(okResponse([0.3]));

    await nvidiaEmbed(["doc content"], "passage");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).input_type).toBe("passage");
  });

  it("throws an informative error when NVIDIA rejects the request", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "{'error':'bad input'}",
    });

    await expect(nvidiaEmbed(["q"], "query")).rejects.toThrow(/400/);
  });
});
