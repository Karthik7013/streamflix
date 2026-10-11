// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, createRef } from "react";
import { render, act, cleanup } from "@testing-library/react";

type FakePlayer = Record<
  "playVideo" | "pauseVideo" | "mute" | "unMute" | "seekTo" | "destroy",
  ReturnType<typeof vi.fn>
> & { isMuted: ReturnType<typeof vi.fn> };

type PlayerEvents = {
  onReady: (event: { target: FakePlayer }) => void;
  onStateChange: (event: { data: number; target: FakePlayer }) => void;
  onError: (event: unknown) => void;
};

let lastOptions: { videoId: string; events: PlayerEvents } | null = null;
let lastPlayer: FakePlayer | null = null;

function makePlayer(): FakePlayer {
  return {
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    mute: vi.fn(),
    unMute: vi.fn(),
    isMuted: vi.fn(() => true),
    seekTo: vi.fn(),
    destroy: vi.fn(),
  };
}

vi.mock("@/lib/youtube-api", () => ({
  loadYouTubeApi: vi.fn(async () => ({
    Player: class {
      constructor(
        _el: HTMLElement,
        options: { videoId: string; events: PlayerEvents }
      ) {
        lastOptions = options;
        lastPlayer = makePlayer();
        Object.assign(this, lastPlayer);
      }
    },
  })),
}));

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let ioCallback: IoCallback | null = null;
const observeSpy = vi.fn();
const disconnectSpy = vi.fn();

import {
  HeroTrailerBackground,
  type HeroTrailerHandle,
} from "@/components/movie/hero-trailer-background";

const URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

function stubBrowser(reducedMotion: boolean) {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IoCallback) {
        ioCallback = callback;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
    }
  );
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion }));
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
}

function fireIntersecting(value: boolean) {
  act(() => {
    ioCallback?.([{ isIntersecting: value }]);
  });
}

function fireVisibility(value: string) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      value,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  lastOptions = null;
  lastPlayer = null;
  ioCallback = null;
  observeSpy.mockClear();
  disconnectSpy.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("HeroTrailerBackground orchestration", () => {
  it("renders nothing without a valid url", () => {
    stubBrowser(false);
    const { container } = render(createElement(HeroTrailerBackground, { url: null }));
    expect(container.firstChild).toBeNull();

    cleanup();
    render(createElement(HeroTrailerBackground, { url: "https://example.com/x.mp4" }));
    expect(lastPlayer).toBeNull();
  });

  it("starts the player after the delay once in view and visible", async () => {
    stubBrowser(false);
    const onReadyChange = vi.fn();
    render(createElement(HeroTrailerBackground, { url: URL, onReadyChange }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(lastPlayer).toBeNull();

    fireIntersecting(true);
    await act(async () => {});

    expect(lastOptions?.videoId).toBe("dQw4w9WgXcQ");
    const player = lastPlayer;
    expect(player).not.toBeNull();
    if (!player) throw new Error("expected player");

    act(() => {
      lastOptions?.events.onReady({ target: player });
    });
    expect(onReadyChange).toHaveBeenCalledWith(true);
    expect(player.mute).toHaveBeenCalled();
    expect(player.playVideo).toHaveBeenCalled();

    act(() => {
      lastOptions?.events.onStateChange({ data: 1, target: player });
    });
    expect(document.querySelector(".hero-trailer-layer--active")).not.toBeNull();
  });

  it("pauses offscreen and resumes on return and on tab visible", async () => {
    stubBrowser(false);
    render(createElement(HeroTrailerBackground, { url: URL }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    fireIntersecting(true);
    await act(async () => {});
    expect(lastPlayer).not.toBeNull();

    const playsBefore = (lastPlayer?.playVideo as ReturnType<typeof vi.fn>).mock.calls.length;
    fireIntersecting(false);
    expect(lastPlayer?.pauseVideo).toHaveBeenCalled();

    fireIntersecting(true);
    expect((lastPlayer?.playVideo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      playsBefore
    );

    fireVisibility("hidden");
    expect(lastPlayer?.pauseVideo).toHaveBeenCalledTimes(2);

    fireVisibility("visible");
    expect((lastPlayer?.playVideo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      playsBefore + 1
    );
  });

  it("never starts with reduced motion and destroys the player on unmount", async () => {
    stubBrowser(true);
    render(createElement(HeroTrailerBackground, { url: URL }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(lastPlayer).toBeNull();

    cleanup();
    stubBrowser(false);
    const rendered = render(createElement(HeroTrailerBackground, { url: URL }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    fireIntersecting(true);
    await act(async () => {});
    expect(lastPlayer).not.toBeNull();

    rendered.unmount();
    expect(lastPlayer?.destroy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("toggles sound through the exposed handle", async () => {
    stubBrowser(false);
    const onSoundChange = vi.fn();
    const ref = createRef<HeroTrailerHandle>();
    render(createElement(HeroTrailerBackground, { url: URL, onSoundChange, ref }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    fireIntersecting(true);
    await act(async () => {});
    expect(lastPlayer).not.toBeNull();

    act(() => {
      ref.current?.toggleSound();
    });
    expect(lastPlayer?.unMute).toHaveBeenCalled();
    expect(onSoundChange).toHaveBeenCalledWith(true);
  });
});
