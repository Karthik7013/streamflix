import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateSeason, deleteSeason } from "@/services/series";

export const PUT = withAdminAuth<{ id: string; sid: string }>(async (request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const updated = await updateSeason(seasonId, body);
  if (!updated) return NextResponse.json({ error: "Season not found" }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withAdminAuth<{ id: string; sid: string }>(async (_request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteSeason(seasonId);
  return NextResponse.json({ success: true });
});
