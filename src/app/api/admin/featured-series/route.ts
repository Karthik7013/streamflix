import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeaturedSeries, addFeaturedSeries } from "@/services/featured-series";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeaturedSeries();
  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": "private, no-cache, max-age=0" } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { seriesId } = body;

  if (!seriesId) {
    return NextResponse.json({ error: { message: "seriesId is required", code: "SERIES_ID_REQUIRED" } }, { status: 400 });
  }

  try {
    const created = await addFeaturedSeries(seriesId);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: { message: "Series is already featured", code: "CONFLICT" } }, { status: 409 });
    }
    throw error;
  }
});
