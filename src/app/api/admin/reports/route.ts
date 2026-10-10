import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminReports } from "@/services/reports";
import { CACHE_CONTROL, parseAdminListParams } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams, undefined, ["status"]);
  const status = searchParams.get("status");

  const result = await listAdminReports({ page, limit, status, search, sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
});
