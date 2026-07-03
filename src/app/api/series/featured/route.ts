import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getFeaturedSeries } from "@/services/featured-series";

export const GET = withAuth(async () => {
  const featured = await getFeaturedSeries();
  return NextResponse.json({ featured }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC },
  });
}, "Internal Server Error");
