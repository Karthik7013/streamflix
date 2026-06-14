import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movieRequests } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "admin") {
    return NextResponse.json({ error: "Admins cannot request movies" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, externalLink } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [req] = await db
      .insert(movieRequests)
      .values({
        userId: session.user.id,
        title: title.trim(),
        description: description || null,
        externalLink: externalLink || null,
      })
      .returning();

    return NextResponse.json(req, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
