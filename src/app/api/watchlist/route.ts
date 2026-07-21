import { NextResponse } from "next/server";
import { safeParseInt } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getUserWatchlist } from "@/services/watchlist";

export const GET = withAuth(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, safeParseInt(searchParams.get("page"), 1));
  const limit = Math.max(1, Math.min(50, safeParseInt(searchParams.get("limit"), 20)));

  const result = await getUserWatchlist(session.user.id, page, limit);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-cache" }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });
