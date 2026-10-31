import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateTag, deleteTag } from "@/services/tags";
import { validateBody, ErrorCode, apiError } from "@/lib/api-errors";
import { updateTagApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const tagId = parseIdParam(params.id);
  if (tagId === null) return apiError("Invalid tag ID", ErrorCode.InvalidId, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", ErrorCode.ValidationError, 400);
  }

  const parsed = validateBody(updateTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await updateTag(tagId, parsed.data.name, parsed.data.imageUrl);
  if ("error" in result) {
    const err = result.error;
    return NextResponse.json({ error: err }, { status: err.code === ErrorCode.NotFound ? 404 : 400 });
  }

  return NextResponse.json({ data: result.data }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const tagId = parseIdParam(params.id);
  if (tagId === null) return apiError("Invalid tag ID", ErrorCode.InvalidId, 400);
  await deleteTag(tagId);
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
