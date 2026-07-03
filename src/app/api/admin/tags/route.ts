import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminTags, createTag } from "@/services/tags";
import { parseAdminListParams } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams, { page: "1", limit: "50" });
  const result = await listAdminTags({ page, limit, search: search ?? "", sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  const createdTag = await createTag(name);
  return NextResponse.json(createdTag, { status: 201 });
});
