import { describe, it, expect, vi, beforeEach } from "vitest";

const scanMock = vi.fn();
const delMock = vi.fn();
const pipelineDelMock = vi.fn();
const pipelineExecMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    scan = scanMock;
    del = delMock;
    pipeline() {
      return { del: pipelineDelMock, exec: pipelineExecMock };
    }
  },
}));

describe("cacheFlushAll", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    scanMock.mockReset();
    delMock.mockReset();
    pipelineDelMock.mockReset();
    pipelineExecMock.mockReset();
  });

  it("deletes only app:* keys and returns the deleted count", async () => {
    scanMock.mockResolvedValueOnce([0, ["app:home:featured-x", "app:tags:all"]]);
    delMock.mockResolvedValueOnce(2);

    const { cacheFlushAll } = await import("@/lib/cache");
    const flushed = await cacheFlushAll();

    expect(flushed).toBe(2);
    expect(scanMock).toHaveBeenCalledWith(0, expect.objectContaining({ match: "app:*" }));
    expect(delMock).toHaveBeenCalledWith("app:home:featured-x", "app:tags:all");
    for (const call of delMock.mock.calls) {
      for (const key of call) {
        expect(String(key).startsWith("app:")).toBe(true);
      }
    }
  });

  it("returns 0 without touching redis when no cache keys exist", async () => {
    scanMock.mockResolvedValueOnce([0, []]);

    const { cacheFlushAll } = await import("@/lib/cache");
    const flushed = await cacheFlushAll();

    expect(flushed).toBe(0);
    expect(delMock).not.toHaveBeenCalled();
  });
});
