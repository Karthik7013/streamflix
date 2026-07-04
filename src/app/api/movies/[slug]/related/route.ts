import { NextResponse } from "next/server";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getRelatedMovies } from "@/services/movies";
import { withAuth } from "@/lib/with-auth";
import { logger } from "@/lib/logger";

export const GET = withAuth<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;

  try {
    const related = await cacheGetOrSet(`related:${slug}`, CACHE_TTL.SLOW, () => getRelatedMovies(slug));
    return NextResponse.json({ related });
  } catch (err) {
    logger.error("movies/[slug]/related GET", err);
    return NextResponse.json({ related: [] });
  }
});
