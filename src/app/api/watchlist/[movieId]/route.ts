import { NextResponse } from "next/server";
import { removeFromWatchlist } from "@/services/watchlist";
import { withAuth } from "@/lib/with-auth";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const DELETE = withAuth<{ movieId: string }>(async (_request, { params, session }) => {
  const movieId = Number(params.movieId);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: { message: "Invalid movieId", code: "INVALID_MOVIE_ID" } }, { status: 400 });
  }

  const result = await removeFromWatchlist(movieId, session.user.id);
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE }
  });
}, { message: "Remove from Watchlist Failed", code: "INTERNAL_ERROR" });