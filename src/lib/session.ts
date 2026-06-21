import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { auth } from "./auth";
import { cacheGetOrSet } from "./cache";

const SESSION_CACHE_TTL = 120;

function sessionKeyFromRequest(headers: Headers): string | null {
  const cookie = headers.get("cookie") || "";
  const auth_h = headers.get("authorization") || "";
  const raw = `${cookie}|${auth_h}`;
  if (!raw.trim() || raw === "|") return null;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `session:${hash}`;
}

export async function getCachedSession(request: NextRequest) {
  const key = sessionKeyFromRequest(request.headers);
  if (!key) return auth.api.getSession({ headers: request.headers });
  return cacheGetOrSet(key, SESSION_CACHE_TTL, () =>
    auth.api.getSession({ headers: request.headers })
  );
}
