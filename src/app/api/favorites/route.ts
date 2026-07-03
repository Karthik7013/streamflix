import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getUserFavorites } from "@/services/favorites";

export const GET = withAuth(async (request, { session }) => {
  const moviesList = await cacheGetOrSet(
    `favorites:${session.user.id}`,
    CACHE_TTL.FAST,
    () => getUserFavorites(session.user.id)
  );

  return NextResponse.json({ movies: moviesList }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, "Fetch Failed");
