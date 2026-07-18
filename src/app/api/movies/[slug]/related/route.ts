import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getRelatedMovies } from "@/services/movies";
import { withAuth } from "@/lib/with-auth";

export const GET = withAuth<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;
  const related = await cacheGetOrSet(`related:${slug}`, CACHE_TTL.SLOW, () => getRelatedMovies(slug));
  return NextResponse.json({ data: related }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to load related movies", code: "INTERNAL_ERROR" });
