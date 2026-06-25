import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminRequests } from "@/services/requests";

const IGNORED_PARAMS = new Set(["page", "limit", "search", "sortBy", "sortDir", "status"]);

function extractColumnFilters(searchParams: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!IGNORED_PARAMS.has(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
}

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || undefined;
  const columnFilters = extractColumnFilters(searchParams);

  try {
    const result = await listAdminRequests({ page, limit, status, search, sortBy, sortDir, columnFilters });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
