import { NextResponse } from "next/server";
import { getMovieIdBySlug } from "@/services/movies";
import { createReport } from "@/services/reports";
import { withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { reportMovieApiSchema } from "@/lib/schemas";

export const POST = withAuth<{ slug: string }>(async (request, { params, session }) => {
  const { slug } = params;
  const body = await request.json();

  const parsed = validateBody(reportMovieApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const movieId = await getMovieIdBySlug(slug);
  if (!movieId) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  const result = await createReport(movieId, session.user.id, parsed.data.description);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ data: result.report }, { status: 201 });
}, { message: "Unable to submit report.", code: "INTERNAL_ERROR" });
