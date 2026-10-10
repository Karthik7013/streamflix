import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { getTagBySlug } from "@/services/tags";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

export const GET = withPublic<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return apiError("Tag Not Found", ErrorCode.NotFound, 404);
  }
  return NextResponse.json({ data: tag }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to fetch tag" });

