import { NextResponse } from "next/server";
import { safeParseInt, CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { addToWatchlistApiSchema } from "@/lib/schemas";
import { addToWatchlist, getUserWatchlist } from "@/services/watchlist";

export const GET = withAuth(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, safeParseInt(searchParams.get("page"), 1));
  const limit = Math.max(1, Math.min(50, safeParseInt(searchParams.get("limit"), 20)));

  const result = await getUserWatchlist(session.user.id, page, limit);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-cache" }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });

export const POST = withAuth(async (request, { session }) => {
  const body = await request.json();

  const parsed = validateBody(addToWatchlistApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await addToWatchlist(parsed.data.movieId, session.user.id);
  if ("error" in result) {
    const err = result as { error: { message: string; code: string } };
    return NextResponse.json(err, { status: err.error.code === "NOT_FOUND" ? 404 : 400 });
  }
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE }
  });
}, { message: "Add to Watchlist Failed", code: "INTERNAL_ERROR" });