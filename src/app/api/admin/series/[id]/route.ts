import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getAdminSeriesById, updateSeries, deleteSeries } from "@/services/series";
import { validateSlug } from "@/lib/validation";
import { validateBody } from "@/lib/api-validation";
import { updateSeriesApiSchema } from "@/lib/schemas";

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
  const parsed = validateBody(updateSeriesApiSchema, body);
  if ("error" in parsed) return parsed.error;

  if (parsed.data.slug) {
    const slugError = validateSlug(parsed.data.slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const updated = await updateSeries(seriesId, parsed.data);
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
