import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getMovieBySlug, checkIsInWatchlist, movieDetailToResponse } from "@/services/movies";
import { withOptionalAuth } from "@/lib/with-auth";

export const GET = withOptionalAuth<{ slug: string }>(async (_request, { params, session }) => {
  const { slug } = params;

  const base = await getMovieBySlug(slug);

  if (!base) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  const isInWatchlist = session ? await checkIsInWatchlist(base.id, session.user.id) : false;

  return NextResponse.json({ data: movieDetailToResponse(base, isInWatchlist) }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });
