import { NextResponse } from "next/server";
import { toggleWatchlist } from "@/services/watchlist";
import { withAuth } from "@/lib/with-auth";

export const POST = withAuth(async (request, { session }) => {
  const { movieId } = await request.json();
  if (typeof movieId !== "number") {
    return NextResponse.json({ error: { message: "Invalid movieId", code: "INVALID_MOVIE_ID" } }, { status: 400 });
  }

  const result = await toggleWatchlist(movieId, session.user.id);
  return NextResponse.json({ data: result });
}, { message: "Toggle Failed", code: "INTERNAL_ERROR" });
