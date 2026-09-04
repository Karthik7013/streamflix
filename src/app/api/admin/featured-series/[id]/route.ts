import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeaturedSeriesOrder, deleteFeaturedSeries } from "@/services/featured-series";
import { validateBody } from "@/lib/api-validation";
import { updateFeaturedSeriesOrderApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const featuredSeriesId = parseInt(params.id);
  if (isNaN(featuredSeriesId)) return NextResponse.json({ error: { message: "Invalid featured series ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const parsed = validateBody(updateFeaturedSeriesOrderApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const updated = await updateFeaturedSeriesOrder(featuredSeriesId, parsed.data.displayOrder);
  if (!updated) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: updated }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const featuredSeriesId = parseInt(params.id);
  if (isNaN(featuredSeriesId)) return NextResponse.json({ error: { message: "Invalid featured series ID", code: "INVALID_ID" } }, { status: 400 });

  const deleted = await deleteFeaturedSeries(featuredSeriesId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Featured series not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
