import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getRecentlyAdded } from "@/services/recent";

export const GET = withAuth(async () => {
  const recentlyAdded = await cacheGetOrSet("home:recently-added", CACHE_TTL.SLOW, () => getRecentlyAdded());
  return NextResponse.json({ recentlyAdded }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, "Internal Server Error");
