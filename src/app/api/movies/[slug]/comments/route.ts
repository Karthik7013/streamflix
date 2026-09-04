import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getCommentsByMovieSlug, createComment } from "@/services/comments";
import { withPublic, withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { createCommentApiSchema } from "@/lib/schemas";

export const GET = withPublic<{ slug: string }>(async (request, { params }) => {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawLimit = parseInt(searchParams.get("limit") || "20");
  const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.max(1, Math.min(50, rawLimit));

  const result = await getCommentsByMovieSlug(slug, { page, limit });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
}, { message: "Failed to fetch comments", code: "INTERNAL_ERROR" });

export const POST = withAuth<{ slug: string }>(async (request, { params, session }) => {
  const { slug } = params;
  const body = await request.json();

  const parsed = validateBody(createCommentApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await createComment(slug, session.user.id, parsed.data.content, {
    userName: session.user.name,
    userImage: session.user.image,
  });
  if ("error" in result) {
    const err = result as { error: { message: string; code: string } };
    return NextResponse.json(err, { status: err.error.code === "NOT_FOUND" ? 404 : 400 });
  }
  return NextResponse.json({ data: result.comment }, { status: 201 });
}, { message: "Failed to create comment", code: "INTERNAL_ERROR" });
