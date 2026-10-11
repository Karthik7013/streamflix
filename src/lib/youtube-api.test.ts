// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  document.head.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as unknown as { YT?: unknown }).YT;
  delete (window as unknown as { onYouTubeIframeAPIReady?: unknown }).onYouTubeIframeAPIReady;
});

async function loadFresh() {
  return import("@/lib/youtube-api");
}

describe("loadYouTubeApi", () => {
  it("injects the IFrame script once and resolves when ready", async () => {
    const { loadYouTubeApi } = await loadFresh();
    const first = loadYouTubeApi();
    const second = loadYouTubeApi();

    expect(document.head.querySelectorAll('script[src*="iframe_api"]')).toHaveLength(1);

    const win = window as unknown as {
      YT?: object;
      onYouTubeIframeAPIReady?: () => void;
    };
    win.YT = {};
    win.onYouTubeIframeAPIReady?.();

    await expect(first).resolves.toBe(win.YT);
    await expect(second).resolves.toBe(win.YT);
    expect(document.head.querySelectorAll('script[src*="iframe_api"]')).toHaveLength(1);
  });

  it("rejects when the API does not load in time", async () => {
    const { loadYouTubeApi } = await loadFresh();
    const pending = loadYouTubeApi();

    const assertion = expect(pending).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });

  it("rejects when the script fails to load", async () => {
    const { loadYouTubeApi } = await loadFresh();
    const pending = loadYouTubeApi();

    const script = document.head.querySelector("script");
    expect(script).not.toBeNull();
    const assertion = expect(pending).rejects.toThrow("failed to load");
    (script as HTMLScriptElement).onerror?.(new Event("error"));
    await assertion;
  });
});
