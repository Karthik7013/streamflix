import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getCreditsByMovie } from "@/services/people";
import { parseIdParam } from "@/lib/api-utils";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const movieId = parseIdParam(searchParams.get("movieId"));
  if (movieId === null) {
    return NextResponse.json({ data: { cast: [], crew: [] } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  }

  const result = await getCreditsByMovie(movieId);
  return NextResponse.json({ data: result }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
