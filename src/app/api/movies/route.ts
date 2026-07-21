import { NextResponse } from "next/server";
import { CACHE_CONTROL, safeParseInt } from "@/lib/api-utils";
import { searchMovies } from "@/services/movies";
import { withAuth } from "@/lib/with-auth";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags") || undefined;
  const page = Math.max(1, safeParseInt(searchParams.get("page"), 1));
  const limit = Math.max(1, Math.min(50, safeParseInt(searchParams.get("limit"), 12)));
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDirParam = searchParams.get("sortDir");
  const sortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : undefined;

  const result = await searchMovies({ q, tagsParam, page, limit, sortBy, sortDir });

  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Query Failed", code: "INTERNAL_ERROR" });
