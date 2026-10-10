import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateTag, deleteTag } from "@/services/tags";
import { validateBody } from "@/lib/api-validation";
import { updateTagApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const tagId = parseIdParam(params.id);
  if (tagId === null) return NextResponse.json({ error: { message: "Invalid tag ID", code: "INVALID_ID" } }, { status: 400 });
  const body = await request.json();

  const parsed = validateBody(updateTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await updateTag(tagId, parsed.data.name, parsed.data.imageUrl);
  if ("error" in result) {
    const err = result as { error: { message: string; code: string } };
    return NextResponse.json(err, { status: err.error.code === "NOT_FOUND" ? 404 : 400 });
  }

  return NextResponse.json({ data: result.tag }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const tagId = parseIdParam(params.id);
  if (tagId === null) return NextResponse.json({ error: { message: "Invalid tag ID", code: "INVALID_ID" } }, { status: 400 });
  await deleteTag(tagId);
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
