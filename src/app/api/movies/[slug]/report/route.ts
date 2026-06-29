import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getMovieBySlug } from "@/services/movies";
import { createReport } from "@/services/reports";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
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
  } catch {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
