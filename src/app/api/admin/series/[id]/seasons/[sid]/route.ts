import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateSeason, deleteSeason } from "@/services/seasons";
import { validateBody } from "@/lib/api-validation";
import { updateSeasonApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string; sid: string }>(async (request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const parsed = validateBody(updateSeasonApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const updated = await updateSeason(seasonId, parsed.data);
  if (!updated) return NextResponse.json({ error: { message: "Season not found", code: "NOT_FOUND" } }, { status: 404 });

  await invalidateCache("series-detail");
  return NextResponse.json({ data: updated }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string; sid: string }>(async (_request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  await deleteSeason(seasonId);
  await invalidateCache("series-detail");
  return NextResponse.json({ data: { success: true } });
});
