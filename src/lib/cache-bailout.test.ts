import { describe, it, expect, vi, beforeEach } from "vitest";

const scanMock = vi.fn();
const delMock = vi.fn();
const getMock = vi.fn();
const setexMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    scan = scanMock;
    del = delMock;
    get = getMock;
    setex = setexMock;
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: loggerErrorMock,
  },
}));

describe("cache prerender bailout", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    scanMock.mockReset();
    delMock.mockReset();
    getMock.mockReset();
    setexMock.mockReset();
    loggerErrorMock.mockClear();
  });

  it("stays quiet when Redis throws a Next.js prerender bailout", async () => {
    const bailout = Object.assign(new Error("Dynamic server usage"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    scanMock.mockRejectedValueOnce(bailout);

    const { cacheFlushAll } = await import("@/lib/cache");
    await expect(cacheFlushAll()).resolves.toBe(0);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("still logs genuine Redis failures", async () => {
    scanMock.mockRejectedValueOnce(new Error("connection reset"));

    const { cacheFlushAll } = await import("@/lib/cache");
    await expect(cacheFlushAll()).resolves.toBe(0);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
