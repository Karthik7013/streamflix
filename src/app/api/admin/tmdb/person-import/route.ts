import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { upsertPersonFromTmdb } from "@/services/people";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody, ErrorCode } from "@/lib/api-errors";
import { tmdbImportApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const POST = withAdminAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`tmdb:${session.user.id}`, RATE_LIMITS.tmdb);
  if (!allowed) return rateLimitResponse();

  const body = await request.json();

  const parsed = validateBody(tmdbImportApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { tmdbId } = parsed.data;

  try {
    const person = await upsertPersonFromTmdb(tmdbId);
    return NextResponse.json({ data: person }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TMDB person import failed";
    return NextResponse.json({ error: { message, code: ErrorCode.ImportFailed } }, { status: 500 });
  }
});
