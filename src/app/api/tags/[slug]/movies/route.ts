import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { getMoviesByTag } from "@/services/tags";
import { CACHE_CONTROL, safeParseInt } from "@/lib/api-utils";

export const GET = withPublic<{ slug: string }>(async (request, { params }) => {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, safeParseInt(searchParams.get("page"), 1));
  const limit = Math.max(1, Math.min(50, safeParseInt(searchParams.get("limit"), 12)));

  const result = await getMoviesByTag(slug, page, limit);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to fetch movies", code: "INTERNAL_ERROR" });
