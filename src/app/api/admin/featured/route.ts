import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeatured, addFeatured } from "@/services/featured";
import { invalidateCache } from "@/lib/cache";
import { validateBody } from "@/lib/api-validation";
import { addFeaturedApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

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
    await invalidateCache("home");
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: { message: "Movie is already featured", code: "CONFLICT" } }, { status: 409 });
    }
    throw error;
  }
});
