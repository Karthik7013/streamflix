import { describe, it, expect, vi, beforeEach } from "vitest";

const updatedRow = { id: 7, title: "n", published: false };
const txMethods: string[] = [];

function makeChain(): unknown {
  const chain = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve([updatedRow]);
      }
      if (typeof prop === "string") txMethods.push(prop);
      return () => chain;
    },
  });
  return chain;
}

function makeTx(): unknown {
  const record = (name: string) => {
    txMethods.push(name);
    return makeChain();
  };
  return {
    update: () => record("update"),
    delete: () => record("delete"),
    insert: () => record("insert"),
    select: () => record("select"),
  };
}

vi.mock("@/db", () => ({
  db: {
    transaction: async (cb: (tx: unknown) => unknown) => cb(makeTx()),
  },
}));

vi.mock("@/lib/rag", () => ({
  indexMovieById: vi.fn(),
  deleteMovieVector: vi.fn(),
}));

import { updateMovie } from "@/services/movies-admin";

beforeEach(() => {
  txMethods.length = 0;
});

describe("updateMovie", () => {
  it("returns the updated row without a follow-up select", async () => {
    const result = await updateMovie(7, { title: "n", tagIds: [1] });

    expect(result).toMatchObject({ id: 7, title: "n" });
    expect(txMethods).toContain("update");
    expect(txMethods).not.toContain("select");
  });
});
