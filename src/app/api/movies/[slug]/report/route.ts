import { NextResponse } from "next/server";
import { getMovieBySlug } from "@/services/movies";
import { createReport } from "@/services/reports";
import { withAuth } from "@/lib/with-auth";

export const POST = withAuth<{ slug: string }>(async (request, { params, session }) => {
  const { slug } = params;
  const body = await request.json();
  const { description } = body;

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const movie = await getMovieBySlug(slug);
  if (!movie) {
    return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
  }

  const result = await createReport(movie.id, session.user.id, description.trim());
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ report: result.report }, { status: 201 });
}, "Failed to submit report");
