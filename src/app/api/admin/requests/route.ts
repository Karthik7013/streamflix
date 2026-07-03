import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminRequests } from "@/services/requests";
import { parsePagination, extractColumnFilters } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const columnFilters = extractColumnFilters(searchParams, ["status"]);

  const result = await listAdminRequests({ page, limit, status, search, sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
});
