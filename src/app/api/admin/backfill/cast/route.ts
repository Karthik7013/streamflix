import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { importCreditsForMovie, backfillAllCredits } from "@/services/people";
import { validateBody, ErrorCode } from "@/lib/api-errors";
import { backfillCastApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(backfillCastApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { movieId, limit } = parsed.data;

  if (movieId) {
    const result = await importCreditsForMovie(movieId);
    if ("error" in result) {
      return NextResponse.json(result, { status: result.error.code === ErrorCode.NotFound ? 404 : 400, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
    }
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  }

  const result = await backfillAllCredits({ limit });
  return NextResponse.json({ data: result }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
