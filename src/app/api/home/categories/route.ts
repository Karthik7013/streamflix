import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getHomeCategories } from "@/services/home-categories";

export const GET = withAuth(async () => {
  const categories = await cacheGetOrSet("home:categories", CACHE_TTL.SLOW, () => getHomeCategories());
  return NextResponse.json({ categories }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, "Internal Server Error");
