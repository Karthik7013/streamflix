import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId } = await request.json();
  if (typeof movieId !== "number") {
    return NextResponse.json({ error: "Invalid movieId" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.movieId, movieId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.movieId, movieId)
          )
        );
      return NextResponse.json({ isFavorited: false });
    } else {
      await db.insert(favorites).values({
        userId: session.user.id,
        movieId,
      });
      return NextResponse.json({ isFavorited: true });
    }
  } catch {
    return NextResponse.json({ error: "Toggle Failed" }, { status: 500 });
  }
}
