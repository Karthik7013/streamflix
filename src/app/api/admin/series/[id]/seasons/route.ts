import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getSeasonsBySeriesId, createSeason } from "@/services/seasons";

export const GET = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const seasons = await getSeasonsBySeriesId(seriesId);
  return NextResponse.json({ data: seasons });
});

export const POST = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const seriesId = parseInt(params.id);
  if (isNaN(seriesId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const created = await createSeason(seriesId, body);
  return NextResponse.json({ data: created }, { status: 201 });
});
