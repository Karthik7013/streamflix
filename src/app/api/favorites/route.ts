import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getUserFavorites } from "@/services/favorites";

export const GET = withAuth(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));

  const result = await getUserFavorites(session.user.id, page, limit);

  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });
