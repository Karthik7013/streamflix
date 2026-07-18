import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { withAuth } from "@/lib/with-auth";
import { getFeaturedSeries } from "@/services/featured-series";

export const GET = withAuth(async () => {
  const featured = await cacheGetOrSet("series:featured", CACHE_TTL.SLOW, () => getFeaturedSeries());
  return NextResponse.json({ data: featured }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC },
  });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
