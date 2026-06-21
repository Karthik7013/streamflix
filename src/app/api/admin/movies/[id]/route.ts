import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, movieTags } from "@/db/schema";
import { eq } from "drizzle-orm";

interface MovieUpdateData {
  title?: string;
  slug?: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string;
  backdropUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: string | null;
  updatedAt?: Date;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);

  try {
    const body = await request.json();
    const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, durationSeconds, releaseDate, tagIds } = body;

    if (slug !== undefined && (!/^[a-z0-9-]+$/.test(slug) || slug.length === 0)) {
      return NextResponse.json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" }, { status: 400 });
    }

    if (durationSeconds !== undefined && (typeof durationSeconds !== "number" || isNaN(durationSeconds) || durationSeconds < 0)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const updateData: MovieUpdateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (backdropUrl !== undefined) updateData.backdropUrl = backdropUrl;
    if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate;

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await db.update(movies).set(updateData).where(eq(movies.id, movieId));
    }

    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(movieTags).where(eq(movieTags.movieId, movieId));

      if (tagIds.length > 0) {
        await db.insert(movieTags).values(
          tagIds.map((tagId: number) => ({
            movieId,
            tagId,
          }))
        );
      }
    }

    const [updatedMovie] = await db
      .select()
      .from(movies)
      .where(eq(movies.id, movieId))
      .limit(1);

    if (!updatedMovie) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    return NextResponse.json(updatedMovie);
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
  const movieId = parseInt(id);

  try {
    await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
    await db.delete(movies).where(eq(movies.id, movieId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
