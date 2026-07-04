import { NextResponse } from "next/server";
import { toggleFavorite } from "@/services/favorites";
import { withAuth } from "@/lib/with-auth";

export const POST = withAuth(async (request, { session }) => {
  const { movieId } = await request.json();
  if (typeof movieId !== "number") {
    return NextResponse.json({ error: "Invalid movieId" }, { status: 400 });
  }

  const result = await toggleFavorite(movieId, session.user.id);
  return NextResponse.json(result);
}, "Toggle Failed");
