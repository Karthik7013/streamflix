import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getMostFavorited } from "@/services/movies";

export const GET = withAuth(async () => {
  const trending = await cacheGetOrSet("trending", CACHE_TTL.DEFAULT, () => getMostFavorited(20));
  return NextResponse.json({ trending }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, "Internal Server Error");
