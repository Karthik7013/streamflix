import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeatured, addFeatured } from "@/services/featured";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeatured();
  return NextResponse.json(
    { featured: result },
    { headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { movieId } = body;

  if (!movieId) {
    return NextResponse.json({ error: "movieId is required" }, { status: 400 });
  }

  try {
    const created = await addFeatured(movieId);
    return NextResponse.json({ featured: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: "Movie is already featured" }, { status: 409 });
    }
    throw error;
  }
});
