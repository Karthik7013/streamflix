import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { ilike, and, lt, desc, inArray, eq, sql, count } from "drizzle-orm";


interface MovieRow {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

async function attachTags(rows: MovieRow[]) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const tagRows = await db
    .select({
      movieId: movieTags.movieId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .where(inArray(movieTags.movieId, ids));
  const tagMap = new Map<number, { id: number; name: string }[]>();
  for (const t of tagRows) {
    if (!tagMap.has(t.movieId)) tagMap.set(t.movieId, []);
    tagMap.get(t.movieId)!.push({ id: t.tagId, name: t.tagName });
  }
  return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) || [] }));
}

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
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
      const settled = await Promise.allSettled([
        db
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
          .limit(limit),
        db
          .select({ value: count() })
          .from(
            db
              .select({ id: movies.id })
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
              .as("filtered")
          ),
      ]);

      if (settled.some(r => r.status === "rejected")) {
        return NextResponse.json({ error: "Query Failed" }, { status: 500 });
      }
      const r0 = settled[0] as PromiseFulfilledResult<MovieRow[]>;
      const r1 = settled[1] as PromiseFulfilledResult<{ value: number }[]>;
      const result = await attachTags(r0.value);
      const total = r1.value[0].value;

      const lastItem = result[result.length - 1];
      return NextResponse.json({
        movies: result,
        total,
        nextCursor: lastItem ? lastItem.id : null,
        hasMore: result.length === limit,
      });
    }

    const settled = await Promise.allSettled([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(movies.id))
        .limit(limit),
      db
        .select({ value: count() })
        .from(movies)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    if (settled.some(r => r.status === "rejected")) {
      return NextResponse.json({ error: "Query Failed" }, { status: 500 });
    }
    const r0 = settled[0] as PromiseFulfilledResult<MovieRow[]>;
    const r1 = settled[1] as PromiseFulfilledResult<{ value: number }[]>;
    const result = await attachTags(r0.value);
    const total = r1.value[0].value;

    const lastItem = result[result.length - 1];
    return NextResponse.json({
      movies: result,
      total,
      nextCursor: lastItem ? lastItem.id : null,
      hasMore: result.length === limit,
    });
  } catch {
    return NextResponse.json({ error: "Query Failed" }, { status: 500 });
  }
}
