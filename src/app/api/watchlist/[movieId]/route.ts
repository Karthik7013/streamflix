import { NextResponse } from "next/server";
import { removeFromWatchlist } from "@/services/watchlist";
import { withAuth } from "@/lib/with-auth";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const DELETE = withAuth<{ movieId: string }>(async (_request, { params, session }) => {
  const movieId = Number(params.movieId);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return apiError("Invalid movieId", ErrorCode.InvalidId, 400);
  }

  const result = await removeFromWatchlist(movieId, session.user.id);
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE }
  });
}, { message: "Remove from Watchlist Failed" });
