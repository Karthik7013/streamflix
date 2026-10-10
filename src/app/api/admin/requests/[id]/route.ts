import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { fulfillRequest, deleteRequest } from "@/services/requests";
import { validateBody } from "@/lib/api-validation";
import { requestStatusApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const PATCH = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const requestId = parseIdParam(params.id);
  if (requestId === null) {
    return apiError("Invalid request ID", ErrorCode.InvalidId, 400);
  }

  const body = await request.json();
  const parsed = validateBody(requestStatusApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { status } = parsed.data;
  if (status === "fulfilled") {
    const result = await fulfillRequest(requestId);
    if ("error" in result) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json({ data: result.request }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  }

  return apiError("Invalid status transition", ErrorCode.InvalidTransition, 400);
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const requestId = parseIdParam(params.id);
  if (requestId === null) {
    return apiError("Invalid request ID", ErrorCode.InvalidId, 400);
  }

  const deleted = await deleteRequest(requestId);
  if (!deleted) {
    return apiError("Request Not Found", ErrorCode.NotFound, 404);
  }
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
