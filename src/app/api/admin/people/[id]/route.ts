import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updatePerson, deletePerson } from "@/services/people";
import { validateBody, ErrorCode, apiError } from "@/lib/api-errors";
import { updatePersonApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const personId = parseIdParam(params.id);
  if (personId === null) return apiError("Invalid person ID", ErrorCode.InvalidId, 400);
  const body = await request.json();

  const parsed = validateBody(updatePersonApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await updatePerson(personId, parsed.data);
  if ("error" in result) {
    const err = result as { error: { message: string; code: string } };
    return NextResponse.json(err, { status: err.error.code === ErrorCode.NotFound ? 404 : 400 });
  }

  return NextResponse.json({ data: result.person }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const personId = parseIdParam(params.id);
  if (personId === null) return apiError("Invalid person ID", ErrorCode.InvalidId, 400);
  await deletePerson(personId);
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
