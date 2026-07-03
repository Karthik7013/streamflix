import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateEpisode, deleteEpisode } from "@/services/episodes";
import { validateSlug } from "@/lib/validation";

export const PUT = withAdminAuth<{ id: string; sid: string; eid: string }>(async (request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  if (body.slug) {
    const slugError = validateSlug(body.slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const updated = await updateEpisode(episodeId, body);
  if (!updated) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withAdminAuth<{ id: string; sid: string; eid: string }>(async (_request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteEpisode(episodeId);
  return NextResponse.json({ success: true });
});
