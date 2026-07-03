import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { updateFeatured, deleteFeatured } from "@/services/featured";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const body = await request.json();
  const { displayOrder } = body;

  const updated = await updateFeatured(parseInt(params.id), displayOrder);
  if (!updated) {
    return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
  }

  return NextResponse.json({ featured: updated });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const deleted = await deleteFeatured(parseInt(params.id));
  if (!deleted) {
    return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
