import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieTags } from "@/db/schema";
import { ilike, and, lt, desc, inArray, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags");
  const cursor = parseInt(searchParams.get("cursor") || "0");
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    const conditions = [];

    if (q) {
      conditions.push(ilike(movies.title, `%${q}%`));
    }

    if (cursor > 0) {
      conditions.push(lt(movies.id, cursor));
    }

    if (tagsParam) {
      const tagIds = tagsParam.split(",").map(Number);
      const result = await db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
        .where(
          conditions.length > 0
            ? and(...conditions, inArray(movieTags.tagId, tagIds))
            : inArray(movieTags.tagId, tagIds)
        )
        .groupBy(movies.id)
        .having(
          sql`count(distinct ${movieTags.tagId}) = ${tagIds.length}`
        )
        .orderBy(desc(movies.id))
        .limit(limit);

      const lastItem = result[result.length - 1];
      return NextResponse.json({
        movies: result,
        nextCursor: lastItem ? lastItem.id : null,
        hasMore: result.length === limit,
      });
    }

    const query = db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies);

    const result = await (conditions.length > 0
      ? query.where(and(...conditions)).orderBy(desc(movies.id)).limit(limit)
      : query.orderBy(desc(movies.id)).limit(limit));

    const lastItem = result[result.length - 1];
    return NextResponse.json({
      movies: result,
      nextCursor: lastItem ? lastItem.id : null,
      hasMore: result.length === limit,
    });
  } catch {
    return NextResponse.json({ error: "Query Failed" }, { status: 500 });
  }
}
