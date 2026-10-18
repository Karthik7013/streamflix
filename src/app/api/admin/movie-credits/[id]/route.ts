import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { deleteMovieCredit } from "@/services/people";
import { parseIdParam, CACHE_CONTROL } from "@/lib/api-utils";
import { apiError, ErrorCode } from "@/lib/api-errors";

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const creditId = parseIdParam(params.id);
  if (creditId === null) return apiError("Invalid credit ID", ErrorCode.InvalidId, 400);

  const result = await deleteMovieCredit(creditId);
  if (!result) {
    return apiError("Credit Not Found", ErrorCode.NotFound, 404);
  }

  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
