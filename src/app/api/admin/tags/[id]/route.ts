import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateTag, deleteTag } from "@/services/tags";
import { validateBody } from "@/lib/api-validation";
import { updateTagApiSchema } from "@/lib/schemas";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const tagId = parseInt(params.id);
  const body = await request.json();

  const parsed = validateBody(updateTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await updateTag(tagId, parsed.data.name);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.tag);
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const tagId = parseInt(params.id);
  await deleteTag(tagId);
  return NextResponse.json({ success: true });
});
