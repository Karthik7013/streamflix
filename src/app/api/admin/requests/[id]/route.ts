import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { fulfillRequest, deleteRequest } from "@/services/requests";
import { validateBody } from "@/lib/api-validation";
import { requestStatusApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const PATCH = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: { message: "Invalid request ID", code: "INVALID_REQUEST_ID" } }, { status: 400 });
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

  return NextResponse.json({ error: { message: "Invalid status transition", code: "INVALID_TRANSITION" } }, { status: 400 });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: { message: "Invalid request ID", code: "INVALID_REQUEST_ID" } }, { status: 400 });
  }

  const deleted = await deleteRequest(requestId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Request Not Found", code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
