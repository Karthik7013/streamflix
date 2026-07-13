import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeaturedSeriesOrder, deleteFeaturedSeries } from "@/services/featured-series";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const body = await request.json();
  const { displayOrder } = body;

  const updated = await updateFeaturedSeriesOrder(parseInt(params.id), displayOrder);
  if (!updated) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const deleted = await deleteFeaturedSeries(parseInt(params.id));
  if (!deleted) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
});
