import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateMovie, deleteMovie } from "@/services/movies-admin";
import { validateSlug, validateDuration } from "@/lib/validation";
import { validateBody } from "@/lib/api-validation";
import { updateMovieApiSchema } from "@/lib/schemas";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const movieId = parseInt(params.id);
  const body = await request.json();

  const parsed = validateBody(updateMovieApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { slug, durationSeconds } = parsed.data;
  const slugError = slug !== undefined ? validateSlug(slug) : null;
  if (slugError) {
    return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });
  }

  const durationError = validateDuration(durationSeconds);
  if (durationError) {
    return NextResponse.json({ error: { message: durationError, code: "INVALID_DURATION" } }, { status: 400 });
  }

  const updatedMovie = await updateMovie(movieId, parsed.data);
  if (!updatedMovie) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: updatedMovie });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const movieId = parseInt(params.id);
  const deleted = await deleteMovie(movieId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: { success: true } });
});
