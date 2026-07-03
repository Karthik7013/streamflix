import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { listSeries } from "@/services/series";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const tagsParam = searchParams.get("tags") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || undefined;

  if (!q && !tagsParam && page === 1 && limit === 12 && !sortBy && !sortDir) {
    const cached = await cacheGetOrSet(
      "series-list:default",
      CACHE_TTL.DEFAULT,
      () => listSeries({ page, limit })
    );
    return NextResponse.json(cached, {
      headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
    });
  }

  const result = await listSeries({ q, tagsParam, page, limit, sortBy, sortDir });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
});
