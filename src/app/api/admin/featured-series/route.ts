import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeaturedSeries, addFeaturedSeries } from "@/services/featured-series";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeaturedSeries();
  return NextResponse.json(
    { featured: result },
    { headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { seriesId } = body;

  if (!seriesId) {
    return NextResponse.json({ error: "seriesId is required" }, { status: 400 });
  }

  try {
    const created = await addFeaturedSeries(seriesId);
    return NextResponse.json({ featured: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: "Series is already featured" }, { status: 409 });
    }
    throw error;
  }
});
