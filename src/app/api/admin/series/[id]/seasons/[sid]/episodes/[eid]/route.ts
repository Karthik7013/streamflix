import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateEpisode, deleteEpisode } from "@/services/episodes";
import { validateSlug } from "@/lib/validation";

export const PUT = withAdminAuth<{ id: string; sid: string; eid: string }>(async (request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  if (body.slug) {
    const slugError = validateSlug(body.slug);
    if (slugError) return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });
  }

  const updated = await updateEpisode(episodeId, body);
  if (!updated) return NextResponse.json({ error: { message: "Episode not found", code: "NOT_FOUND" } }, { status: 404 });

  return NextResponse.json({ data: updated });
});

export const DELETE = withAdminAuth<{ id: string; sid: string; eid: string }>(async (_request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  await deleteEpisode(episodeId);
  return NextResponse.json({ data: { success: true } });
});
