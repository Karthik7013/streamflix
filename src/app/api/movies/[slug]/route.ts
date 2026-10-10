import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getMovieBySlug } from "@/services/movies";
import { withPublic } from "@/lib/with-auth";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const GET = withPublic<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;

  const base = await getMovieBySlug(slug);

  if (!base) {
    return apiError("Movie Not Found", ErrorCode.NotFound, 404);
  }

  return NextResponse.json({ data: base }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed" });
