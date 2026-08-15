import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getMovieBySlug } from "@/services/movies";
import { withPublic } from "@/lib/with-auth";

export const GET = withPublic<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;

  const base = await getMovieBySlug(slug);

  if (!base) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: base }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });