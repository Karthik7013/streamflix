import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateEpisode, deleteEpisode } from "@/services/episodes";
import { validateSlug } from "@/lib/validation";
import { validateBody } from "@/lib/api-validation";
import { updateEpisodeApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string; sid: string; eid: string }>(async (request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  const body = await request.json();
  const parsed = validateBody(updateEpisodeApiSchema, body);
  if ("error" in parsed) return parsed.error;

  if (parsed.data.slug) {
    const slugError = validateSlug(parsed.data.slug);
    if (slugError) return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });
  }

  const updated = await updateEpisode(episodeId, parsed.data);
  if (!updated) return NextResponse.json({ error: { message: "Episode not found", code: "NOT_FOUND" } }, { status: 404 });

  await invalidateCache("series-detail");
  return NextResponse.json({ data: updated }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string; sid: string; eid: string }>(async (_request, { params }) => {
  const episodeId = parseInt(params.eid);
  if (isNaN(episodeId)) return NextResponse.json({ error: { message: "Invalid ID", code: "INVALID_ID" } }, { status: 400 });

  await deleteEpisode(episodeId);
  await invalidateCache("series-detail");
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
