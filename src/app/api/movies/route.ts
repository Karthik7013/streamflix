import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { searchMovies } from "@/services/movies";
import { withAuth } from "@/lib/with-auth";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12")));
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDirParam = searchParams.get("sortDir");
  const sortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : undefined;

  const isDefaultPage = !q && !tagsParam && page === 1 && !sortBy && !sortDir;
  const result = isDefaultPage
    ? await cacheGetOrSet(`movies:page1:${limit}`, CACHE_TTL.DEFAULT, () => searchMovies({ q, tagsParam, page, limit, sortBy, sortDir }))
    : await searchMovies({ q, tagsParam, page, limit, sortBy, sortDir });

  return NextResponse.json({
    movies: result.movies,
    total: result.total,
    page,
    hasMore: page * limit < result.total,
  }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, "Query Failed");
