import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tagId = parseInt(id);

  try {
    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      await db
        .update(tags)
        .set({ name: name.trim() })
        .where(eq(tags.id, tagId));
    }

    const [updatedTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (!updatedTag) {
      return NextResponse.json({ error: "Tag Not Found" }, { status: 404 });
    }

    return NextResponse.json(updatedTag);
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tagId = parseInt(id);

  try {
    await db.delete(tags).where(eq(tags.id, tagId));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
