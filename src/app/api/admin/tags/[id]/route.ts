import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateTag, deleteTag } from "@/services/tags";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const tagId = parseInt(params.id);
  const body = await request.json();
  const { name } = body;

  const result = await updateTag(tagId, name);
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
