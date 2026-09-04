import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getSeasonsBySeriesId, createSeason } from "@/services/seasons";
import { validateBody } from "@/lib/api-validation";
import { createSeasonApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const seasons = await getSeasonsBySeriesId(seriesId);
  return NextResponse.json({ data: seasons }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const POST = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const parsed = validateBody(createSeasonApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const created = await createSeason(seriesId, parsed.data);
  await invalidateCache("series-detail");
  return NextResponse.json({ data: created }, { status: 201, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
