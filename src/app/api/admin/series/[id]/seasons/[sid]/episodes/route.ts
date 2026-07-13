import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getEpisodesBySeasonId, createEpisode } from "@/services/episodes";
import { validateSlug } from "@/lib/validation";

export const GET = withAdminAuth<{ id: string; sid: string }>(async (_request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const episodes = await getEpisodesBySeasonId(seasonId);
  return NextResponse.json({ data: episodes });
});

export const POST = withAdminAuth<{ id: string; sid: string }>(async (request, { params }) => {
  const seasonId = parseInt(params.sid);
  if (isNaN(seasonId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  if (!body.title || !body.slug) {
    return NextResponse.json({ error: { message: "Title and slug are required", code: "TITLE_SLUG_REQUIRED" } }, { status: 400 });
  }

  const slugError = validateSlug(body.slug);
  if (slugError) return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });

  const created = await createEpisode(seasonId, body);
  return NextResponse.json({ data: created }, { status: 201 });
});
