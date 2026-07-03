import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminReports } from "@/services/reports";
import { parsePagination, extractColumnFilters } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const columnFilters = extractColumnFilters(searchParams, ["status"]);

  const result = await listAdminReports({ page, limit, status, search, sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
});
