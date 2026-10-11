// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { usePlayerUI } from "@/components/streamflix-player/use-player-ui";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(initialPlaying: boolean) {
  let renders = 0;
  const hook = renderHook(
    (props: { playing: boolean }) => {
      renders += 1;
      return usePlayerUI(props.playing);
    },
    { initialProps: { playing: initialPlaying } }
  );
  return { ...hook, renderCount: () => renders };
}

describe("usePlayerUI idle", () => {
  it("does not re-render every second while playing", () => {
    const { renderCount } = setup(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(renderCount()).toBe(1);
  });

  it("goes idle after 3.2s of playback without interaction", () => {
    const { result } = setup(true);
    expect(result.current.idle).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(result.current.idle).toBe(true);
  });

  it("resets idle on interaction and stays non-idle while paused", () => {
    const { result, rerender } = setup(true);

    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(result.current.idle).toBe(true);

    act(() => {
      result.current.resetIdle();
    });
    expect(result.current.idle).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3199);
    });
    expect(result.current.idle).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.idle).toBe(true);

    rerender({ playing: false });
    expect(result.current.idle).toBe(false);
  });
});
