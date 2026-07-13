import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeatured, addFeatured } from "@/services/featured";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeatured();
  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { movieId } = body;

  if (!movieId) {
    return NextResponse.json({ error: { message: "movieId is required", code: "MOVIE_ID_REQUIRED" } }, { status: 400 });
  }

  try {
    const created = await addFeatured(movieId);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: { message: "Movie is already featured", code: "CONFLICT" } }, { status: 409 });
    }
    throw error;
  }
});
