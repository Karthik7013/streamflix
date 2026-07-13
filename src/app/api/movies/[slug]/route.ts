import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getMovieBySlug, checkFavorite, movieDetailToResponse } from "@/services/movies";
import { withAuth } from "@/lib/with-auth";

export const GET = withAuth<{ slug: string }>(async (_request, { params, session }) => {
  const { slug } = params;

  const base = await cacheGetOrSet(`movie:${slug}`, CACHE_TTL.DEFAULT, () => getMovieBySlug(slug));

  if (!base) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  const isFavorited = await checkFavorite(base.id, session.user.id);

  return NextResponse.json({ data: movieDetailToResponse(base, isFavorited) }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });
