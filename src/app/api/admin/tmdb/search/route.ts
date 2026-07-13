import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { searchTMDB, searchTMDBTV } from "@/services/tmdb";

export const POST = withAdminAuth(async (request) => {
  const { query, mediaType = "movie" } = await request.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: { message: "query is required", code: "QUERY_REQUIRED" } }, { status: 400 });
  }

  const results = mediaType === "tv" ? await searchTMDBTV(query) : await searchTMDB(query);
  return NextResponse.json({ results });
});
