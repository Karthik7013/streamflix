import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateMovie, deleteMovie } from "@/services/movies";
import { validateSlug, validateDuration } from "@/lib/validation";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const movieId = parseInt(params.id);
  const body = await request.json();
  const { slug, durationSeconds } = body;

  const slugError = slug !== undefined ? validateSlug(slug) : null;
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const durationError = validateDuration(durationSeconds);
  if (durationError) {
    return NextResponse.json({ error: durationError }, { status: 400 });
  }

  const updatedMovie = await updateMovie(movieId, body);
  if (!updatedMovie) {
    return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
  }

  return NextResponse.json(updatedMovie);
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const movieId = parseInt(params.id);
  const deleted = await deleteMovie(movieId);
  if (!deleted) {
    return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
