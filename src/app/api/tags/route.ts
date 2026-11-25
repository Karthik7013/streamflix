import type { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getAllTags } from "@/services/tags";
import { withPublic } from "@/lib/with-auth";

export const runtime = "edge";

export const GET = withPublic(async (request) => {
  const result = await getAllTags();
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed" });
