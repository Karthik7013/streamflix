import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { withAuth } from "@/lib/with-auth";
import { getFeatured } from "@/services/featured";

export const GET = withAuth(async () => {
  const featured = await cacheGetOrSet("home:featured", CACHE_TTL.SLOW, () => getFeatured());
  return NextResponse.json({ data: featured }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
