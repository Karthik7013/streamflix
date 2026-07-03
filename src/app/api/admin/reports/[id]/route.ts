import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateReportStatus, deleteReport } from "@/services/reports";

export const PATCH = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const reportId = parseInt(params.id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;
  if (!status || !["pending", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await updateReportStatus(reportId, status);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.report);
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const reportId = parseInt(params.id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  const deleted = await deleteReport(reportId);
  if (!deleted) {
    return NextResponse.json({ error: "Report Not Found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
