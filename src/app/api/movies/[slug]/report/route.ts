import { NextResponse } from "next/server";
import { getMovieIdBySlug } from "@/services/movies";
import { createReport } from "@/services/reports";
import { withAuth } from "@/lib/with-auth";
import { validateBody, ErrorCode, apiError } from "@/lib/api-errors";
import { reportMovieApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withAuth<{ slug: string }>(async (request, { params, session }) => {
  const { allowed } = await rateLimit(`report:${session.user.id}`, RATE_LIMITS.report);
  if (!allowed) return rateLimitResponse();

  const { slug } = params;
  const body = await request.json();

  const parsed = validateBody(reportMovieApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const movieId = await getMovieIdBySlug(slug);
  if (!movieId) {
    return apiError("Movie Not Found", ErrorCode.NotFound, 404);
  }

  const result = await createReport(movieId, session.user.id, parsed.data.description);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ data: result.report }, { status: 201, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
}, { message: "Unable to submit report." });