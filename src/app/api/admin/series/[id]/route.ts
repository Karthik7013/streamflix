import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getAdminSeriesById, updateSeries, deleteSeries } from "@/services/series";
import { validateSlug } from "@/lib/validation";

export const GET = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await getAdminSeriesById(seriesId);
  if (!result) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  return NextResponse.json(result);
});

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  if (body.slug) {
    const slugError = validateSlug(body.slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const updated = await updateSeries(seriesId, body);
  if (!updated) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const deleted = await deleteSeries(seriesId);
  if (!deleted) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  return NextResponse.json({ success: true });
});
