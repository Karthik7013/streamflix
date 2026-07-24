import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminTags, createTag } from "@/services/tags";
import { parseAdminListParams } from "@/lib/api-utils";
import { validateBody } from "@/lib/api-validation";
import { createTagApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams, { page: "1", limit: "50" });
  const result = await listAdminTags({ page, limit, search: search ?? "", sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-cache, max-age=0" },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(createTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const createdTag = await createTag(parsed.data.name);
  await invalidateCache("tags");
  return NextResponse.json(createdTag, { status: 201 });
});
