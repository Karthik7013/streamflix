import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { saveWatchProgressSchema, deleteWatchProgressSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getWatchProgress, getUserWatchProgressList, saveWatchProgress, deleteWatchProgress as deleteProgress } from "@/services/watch-progress";

export const GET = withAuth(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId");
  const episodeId = searchParams.get("episodeId");

  if (movieId || episodeId) {
    const result = await getWatchProgress(
      session.user.id,
      movieId ? parseInt(movieId) : undefined,
      episodeId ? parseInt(episodeId) : undefined
    );
    return NextResponse.json({ data: result }, {
      headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
    });
  }

  const result = await getUserWatchProgressList(session.user.id, 20);
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
}, { message: "Failed to fetch watch progress", code: "INTERNAL_ERROR" });

export const POST = withAuth(async (request, { session }) => {
  const body = await request.json();

  const parsed = validateBody(saveWatchProgressSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await saveWatchProgress({
    ...parsed.data,
    userId: session.user.id,
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ data: result.progress }, { status: 201 });
}, { message: "Failed to save watch progress", code: "INTERNAL_ERROR" });

export const DELETE = withAuth(async (request, { session }) => {
  const body = await request.json();

  const parsed = validateBody(deleteWatchProgressSchema, body);
  if ("error" in parsed) return parsed.error;

  await deleteProgress(
    session.user.id,
    parsed.data.movieId,
    parsed.data.episodeId
  );

  return NextResponse.json({ data: { success: true } }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
}, { message: "Failed to delete watch progress", code: "INTERNAL_ERROR" });
