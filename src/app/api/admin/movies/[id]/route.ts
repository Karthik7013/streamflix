import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateMovie, deleteMovie } from "@/services/movies-admin";
import { validateBody } from "@/lib/api-validation";
import { updateMovieApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const movieId = parseIdParam(params.id);
  if (movieId === null) return NextResponse.json({ error: { message: "Invalid movie ID", code: "INVALID_ID" } }, { status: 400 });
  const body = await request.json();

  const parsed = validateBody(updateMovieApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const updatedMovie = await updateMovie(movieId, parsed.data);
  if (!updatedMovie) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: updatedMovie }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const movieId = parseIdParam(params.id);
  if (movieId === null) return NextResponse.json({ error: { message: "Invalid movie ID", code: "INVALID_ID" } }, { status: 400 });
  const deleted = await deleteMovie(movieId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Movie Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
