import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeatured, addFeatured } from "@/services/featured";
import { validateBody } from "@/lib/api-validation";
import { addFeaturedApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeatured();
  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const parsed = validateBody(addFeaturedApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { movieId } = parsed.data;

  try {
    const created = await addFeatured(movieId);
    if (created && typeof created === "object" && "error" in created) {
      return NextResponse.json({ error: created.error }, { status: 409, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
    }
    return NextResponse.json({ data: created }, { status: 201, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.code === "23505") {
      return NextResponse.json({ error: { message: "Movie is already featured", code: ErrorCode.Conflict } }, { status: 409 });
    }
    throw error;
  }
});
