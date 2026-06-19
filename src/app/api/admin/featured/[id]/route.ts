import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { featuredMovies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { displayOrder } = body;

    const [updated] = await db
      .update(featuredMovies)
      .set({ displayOrder })
      .where(eq(featuredMovies.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
    }

    return NextResponse.json({ featured: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update featured movie" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(featuredMovies)
      .where(eq(featuredMovies.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete featured movie" }, { status: 500 });
  }
}
