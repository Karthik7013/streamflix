import { NextRequest, NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { getMovieBySlug, checkFavorite, movieDetailToResponse } from "@/services/movies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const base = await cacheGetOrSet(`movie:${slug}`, CACHE_TTL.DEFAULT, () => getMovieBySlug(slug));

    if (!base) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    const isFavorited = await checkFavorite(base.id, session.user.id);

    return NextResponse.json(movieDetailToResponse(base, isFavorited), {
      headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
    });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
