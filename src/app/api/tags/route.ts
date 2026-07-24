import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withPublic } from "@/lib/with-auth";
import { getAllTags } from "@/services/tags";

export const GET = withPublic(async () => {
  const result = await getAllTags();
  return NextResponse.json({ data: result }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Fetch Failed", code: "INTERNAL_ERROR" });
