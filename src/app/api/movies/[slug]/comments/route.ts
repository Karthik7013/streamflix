import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getCommentsByMovieSlug, createComment } from "@/services/comments";
import { withAuth } from "@/lib/with-auth";

export const GET = withAuth<{ slug: string }>(async (request, { params }) => {
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
}, "Failed to fetch comments");

export const POST = withAuth<{ slug: string }>(async (request, { params, session }) => {
  const { slug } = params;
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const result = await createComment(slug, session.user.id, content.trim());
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ comment: result.comment }, { status: 201 });
}, "Failed to create comment");
