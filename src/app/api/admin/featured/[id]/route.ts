import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeatured, deleteFeatured } from "@/services/featured";
import { invalidateCache } from "@/lib/cache";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const body = await request.json();
  const { displayOrder } = body;

  const featuredId = parseInt(params.id);
  if (isNaN(featuredId)) return NextResponse.json({ error: { message: "Invalid featured ID", code: "INVALID_ID" } }, { status: 400 });

  const updated = await updateFeatured(featuredId, displayOrder);
  if (!updated) {
    return NextResponse.json({ error: { message: "Featured movie not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: updated });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const featuredId = parseInt(params.id);
  if (isNaN(featuredId)) return NextResponse.json({ error: { message: "Invalid featured ID", code: "INVALID_ID" } }, { status: 400 });

  const deleted = await deleteFeatured(featuredId);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Featured movie not found", code: "NOT_FOUND" } }, { status: 404 });
  }

  await invalidateCache("home");
  return NextResponse.json({ data: { success: true } });
});
