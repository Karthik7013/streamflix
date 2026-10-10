import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeatured, deleteFeatured } from "@/services/featured";
import { validateBody } from "@/lib/api-validation";
import { updateFeaturedOrderApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const body = await request.json();
  const parsed = validateBody(updateFeaturedOrderApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { displayOrder } = parsed.data;

  const featuredId = parseIdParam(params.id);
  if (featuredId === null) return apiError("Invalid featured ID", ErrorCode.InvalidId, 400);

  const updated = await updateFeatured(featuredId, displayOrder);
  if (!updated) {
    return apiError("Featured movie not found", ErrorCode.NotFound, 404);
  }

  return NextResponse.json({ data: updated }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const featuredId = parseIdParam(params.id);
  if (featuredId === null) return apiError("Invalid featured ID", ErrorCode.InvalidId, 400);

  const deleted = await deleteFeatured(featuredId);
  if (!deleted) {
    return apiError("Featured movie not found", ErrorCode.NotFound, 404);
  }

  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
