import { NextResponse } from "next/server";
import { CACHE_CONTROL, safeParseInt } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { listSeries } from "@/services/series";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const tagsParam = searchParams.get("tags") || undefined;
  const page = safeParseInt(searchParams.get("page"), 1);
  const limit = safeParseInt(searchParams.get("limit"), 12);
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || undefined;

  const result = await listSeries({ q, tagsParam, page, limit, sortBy, sortDir });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
});
