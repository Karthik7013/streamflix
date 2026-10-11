import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map<string, string>();
const selectSpy = vi.fn();

function makeChain(): unknown {
  const chain = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve([]);
      }
      return () => chain;
    },
  });
  return chain;
}

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      selectSpy(...args);
      return makeChain();
    },
    transaction: async (cb: (tx: unknown) => unknown) =>
      cb({ delete: () => makeChain() }),
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(key: string) {
      const raw = store.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    }
    async setex(key: string, _ttl: number, value: string) {
      store.set(key, value);
      return "OK";
    }
    async scan(_cursor: number, opts: { match: string }) {
      const prefix = opts.match.replace(/\*/g, "");
      return [0, [...store.keys()].filter((k) => k.startsWith(prefix))] as [
        number,
        string[],
      ];
    }
    async del(...keys: string[]) {
      keys.forEach((k) => store.delete(k));
      return keys.length;
    }
    pipeline() {
      const queued: string[][] = [];
      return {
        del: (...keys: string[]) => {
          queued.push(keys);
        },
        exec: async () => {
          queued.flat().forEach((k) => store.delete(k));
          return [];
        },
      };
    }
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { signOut: vi.fn(async () => {}) } },
}));

process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8079";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

const { getRecentSignups, deleteAccount } = await import("@/services/users");

beforeEach(() => {
  store.clear();
  selectSpy.mockClear();
});

describe("users service caching", () => {
  it("serves repeat dashboard reads from cache", async () => {
    await getRecentSignups();
    await getRecentSignups();

    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  it("scopes account-deletion busts to the deleted user", async () => {
    store.set("app:watchlist:user:u1:first:20", JSON.stringify({ data: [] }));
    store.set("app:watchlist:user:u2:first:20", JSON.stringify({ data: [] }));

    await deleteAccount("u1", new Headers());

    expect(store.has("app:watchlist:user:u1:first:20")).toBe(false);
    expect(store.has("app:watchlist:user:u2:first:20")).toBe(true);
  });
});
