import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateReportStatus, deleteReport } from "@/services/reports";
import { validateBody } from "@/lib/api-validation";
import { reportStatusApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL, parseIdParam } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const PATCH = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const reportId = parseIdParam(params.id);
  if (reportId === null) {
    return apiError("Invalid report ID", ErrorCode.InvalidId, 400);
  }

  const body = await request.json();
  const parsed = validateBody(reportStatusApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { status } = parsed.data;

  const result = await updateReportStatus(reportId, status);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }
  return NextResponse.json({ data: result.report }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const reportId = parseIdParam(params.id);
  if (reportId === null) {
    return apiError("Invalid report ID", ErrorCode.InvalidId, 400);
  }

  const deleted = await deleteReport(reportId);
  if (!deleted) {
    return apiError("Report Not Found", ErrorCode.NotFound, 404);
  }
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
