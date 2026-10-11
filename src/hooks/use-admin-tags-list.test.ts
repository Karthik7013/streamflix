// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    tags: {
      list: vi.fn(async () => ({
        data: [{ id: 1, name: "action", slug: "action" }],
        meta: { total: 1, totalPages: 1, page: 1, limit: 50, hasMore: false },
      })),
    },
  },
}));

import { useAdminTagsList } from "@/hooks/use-admin-tags-list";

const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client }, children);
}

describe("useAdminTagsList", () => {
  it("loads tags with limit 50 and shares the base list key shape", async () => {
    const { result } = renderHook(() => useAdminTagsList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([
      { id: 1, name: "action", slug: "action" },
    ]);
    expect(result.current.limit).toBe(50);

    expect(
      client.getQueryData(["admin-tags", 1, "", undefined, "asc", ""])
    ).toBeDefined();
  });
});
