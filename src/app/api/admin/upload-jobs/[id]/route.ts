import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getUploadJob } from "@/services/upload-jobs";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withAdminAuth<{ id: string }>(async (request, context) => {
  const id = parseInt(context.params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: { message: "Invalid job id", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const job = await getUploadJob(id);
  if (!job) {
    return NextResponse.json({ error: { message: "Job not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  return NextResponse.json({ data: job }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
});
