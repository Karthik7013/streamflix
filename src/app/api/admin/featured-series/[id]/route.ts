import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeaturedSeriesOrder, deleteFeaturedSeries } from "@/services/featured-series";
import { invalidateCache } from "@/lib/cache";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const body = await request.json();
  const { displayOrder } = body;

  const featuredSeriesId = parseInt(params.id);
  if (isNaN(featuredSeriesId)) return NextResponse.json({ error: { message: "Invalid featured series ID", code: "INVALID_ID" } }, { status: 400 });

  const updated = await updateFeaturedSeriesOrder(featuredSeriesId, displayOrder);
  if (!updated) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: updated });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const featuredSeriesId = parseInt(params.id);
  if (isNaN(featuredSeriesId)) return NextResponse.json({ error: { message: "Invalid featured series ID", code: "INVALID_ID" } }, { status: 400 });

  const deleted = await deleteFeaturedSeries(featuredSeriesId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: { success: true } });
});
