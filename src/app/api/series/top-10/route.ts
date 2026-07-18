import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { withAuth } from "@/lib/with-auth";
import { getTop10Series } from "@/services/series-recent";

export const GET = withAuth(async () => {
  const top10 = await cacheGetOrSet("series:top10", CACHE_TTL.DEFAULT, () => getTop10Series());
  return NextResponse.json({ data: top10 }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC },
  });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
