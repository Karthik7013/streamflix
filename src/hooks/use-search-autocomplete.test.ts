// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

vi.mock("@/lib/api/search", () => ({
  searchApi: {
    autocomplete: vi.fn(async () => ({ data: [] })),
  },
}));

import { searchApi } from "@/lib/api/search";
import { useSearchAutocomplete } from "@/hooks/use-search-autocomplete";

const autocomplete = vi.mocked(searchApi.autocomplete);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  autocomplete.mockClear();
});

describe("useSearchAutocomplete", () => {
  it("waits for typing to settle before fetching", async () => {
    const hook = renderHook((props: { q: string }) => useSearchAutocomplete(props.q), {
      wrapper,
      initialProps: { q: "" },
    });

    hook.rerender({ q: "ab" });
    hook.rerender({ q: "abc" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(autocomplete).toHaveBeenCalledTimes(1);
    expect(autocomplete).toHaveBeenCalledWith("abc");
  });
});
