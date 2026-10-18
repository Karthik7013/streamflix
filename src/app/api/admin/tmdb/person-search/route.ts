import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { searchTMDbPeople } from "@/services/tmdb";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody } from "@/lib/api-errors";
import { tmdbSearchApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const POST = withAdminAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`tmdb:${session.user.id}`, RATE_LIMITS.tmdb);
  if (!allowed) return rateLimitResponse();

  const body = await request.json();

  const parsed = validateBody(tmdbSearchApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { query } = parsed.data;
  const results = await searchTMDbPeople(query);
  return NextResponse.json({ results }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
