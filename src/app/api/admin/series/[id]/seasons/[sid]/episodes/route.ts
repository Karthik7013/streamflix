import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getEpisodesBySeasonId, createEpisode } from "@/services/episodes";
import { validateSlug } from "@/lib/validation";
import { validateBody } from "@/lib/api-validation";
import { createEpisodeApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withAdminAuth<{ id: string; sid: string }>(async (_request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const episodes = await getEpisodesBySeasonId(seasonId);
  return NextResponse.json({ data: episodes }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const POST = withAdminAuth<{ id: string; sid: string }>(async (request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const parsed = validateBody(createEpisodeApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const slugError = validateSlug(parsed.data.slug);
  if (slugError) return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });

  const created = await createEpisode(seasonId, parsed.data);
  await invalidateCache("series-detail");
  return NextResponse.json({ data: created }, { status: 201, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
