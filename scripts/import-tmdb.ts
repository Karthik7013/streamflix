import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/db";
import {
  movies,
  tags,
  movieTags,
  people,
  movieCast,
  movieCrew,
} from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("Missing TMDB_API_KEY in .env.local");
  process.exit(1);
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const TMDB_GENRES_CACHE = new Map<
  number,
  { id: number; name: string }
>();

async function tmdbFetch<T>(path: string, params = ""): Promise<T> {
  const url = `https://api.themoviedb.org/3${path}?api_key=${TMDB_API_KEY}&language=en-US${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB ${res.status}: ${text}`);
  }
  return res.json();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

async function ensureGenreTags(
  genreIds: number[]
): Promise<number[]> {
  if (genreIds.length === 0) return [];

  const missing = genreIds.filter((id) => !TMDB_GENRES_CACHE.has(id));
  if (missing.length > 0) {
    const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
      "/genre/movie/list"
    );
    for (const g of data.genres) {
      TMDB_GENRES_CACHE.set(g.id, g);
    }
  }

  const tagIds: number[] = [];
  for (const gid of genreIds) {
    const genre = TMDB_GENRES_CACHE.get(gid);
    if (!genre) continue;

    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, genre.name))
      .limit(1);

    let tagId: number;
    if (existing.length > 0) {
      tagId = existing[0].id;
    } else {
      const [inserted] = await db
        .insert(tags)
        .values({ name: genre.name })
        .returning({ id: tags.id });
      tagId = inserted.id;
    }
    tagIds.push(tagId);
  }
  return tagIds;
}

async function syncCast(movieId: number, cast: any[]) {
  for (const c of cast.slice(0, 20)) {
    const personId = c.id;
    const existing = await db
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(people).values({
        id: personId,
        name: c.name,
        profileUrl: c.profile_path
          ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}`
          : null,
      });
    }

    await db
      .insert(movieCast)
      .values({
        movieId,
        personId,
        characterName: c.character || "Unknown",
        orderBilling: c.order,
      })
      .onConflictDoNothing();
  }
}

async function syncCrew(movieId: number, crew: any[]) {
  const seen = new Set<string>();
  for (const c of crew.slice(0, 30)) {
    const key = `${c.id}-${c.department}-${c.job}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await db
      .select()
      .from(people)
      .where(eq(people.id, c.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(people).values({
        id: c.id,
        name: c.name,
        profileUrl: c.profile_path
          ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}`
          : null,
      });
    }

    await db
      .insert(movieCrew)
      .values({
        movieId,
        personId: c.id,
        department: c.department,
        job: c.job,
      })
      .onConflictDoNothing();
  }
}

interface TmdbMovie {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  release_date: string;
  original_language: string;
  genres: { id: number; name: string }[];
  credits?: {
    cast: any[];
    crew: any[];
  };
}

async function importMovie(tmdbId: number) {
  console.log(`\nImporting TMDB ID: ${tmdbId}...`);

  const data = await tmdbFetch<TmdbMovie>(
    `/movie/${tmdbId}`,
    "&append_to_response=credits"
  );

  const slug = slugify(data.title);

  const existingMovie = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.tmdbId, tmdbId))
    .limit(1);

  if (!data.poster_path) {
    throw new Error("Movie has no poster_path — skipping");
  }

  const movieValues = {
    title: data.title,
    slug,
    description: data.overview || null,
    thumbnailUrl: `${TMDB_IMAGE_BASE}/w500${data.poster_path}`,
    backdropUrl: data.backdrop_path
      ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}`
      : null,
    durationSeconds: data.runtime ? data.runtime * 60 : null,
    releaseDate: data.release_date || null,
    tmdbId,
    originalLanguage: data.original_language || null,
  };

  let movieId: number;

  if (existingMovie.length > 0) {
    movieId = existingMovie[0].id;
    await db.update(movies).set(movieValues).where(eq(movies.id, movieId));
    console.log(`  Updated: ${data.title} (ID: ${movieId})`);
  } else {
    const [inserted] = await db
      .insert(movies)
      .values(movieValues)
      .returning({ id: movies.id });
    movieId = inserted.id;
    console.log(`  Created: ${data.title} (ID: ${movieId})`);
  }

  if (data.genres?.length > 0) {
    const tagIds = await ensureGenreTags(data.genres.map((g) => g.id));

    await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
    if (tagIds.length > 0) {
      await db.insert(movieTags).values(
        tagIds.map((tagId) => ({ movieId, tagId }))
      );
    }
    console.log(`  Tags synced: ${tagIds.length} genres`);
  }

  if (data.credits) {
    await db.delete(movieCast).where(eq(movieCast.movieId, movieId));
    await db.delete(movieCrew).where(eq(movieCrew.movieId, movieId));

    await syncCast(movieId, data.credits.cast);
    await syncCrew(movieId, data.credits.crew);
    console.log(
      `  Cast: ${data.credits.cast.length}, Crew: ${data.credits.crew.length}`
    );
  }

  return movieId;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/import-tmdb.ts <tmdbId1> <tmdbId2> ..."
    );
    console.error("   or: npx tsx scripts/import-tmdb.ts --file ids.txt");
    process.exit(1);
  }

  let ids: number[];
  if (args[0] === "--file") {
    const fs = await import("fs");
    const content = fs.readFileSync(args[1], "utf-8");
    ids = content
      .split(/[\n,]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  } else {
    ids = args.map((s) => parseInt(s)).filter((n) => !isNaN(n));
  }

  if (ids.length === 0) {
    console.error("No valid TMDB IDs provided.");
    process.exit(1);
  }

  console.log(`Importing ${ids.length} movie(s)...`);

  for (const id of ids) {
    try {
      await importMovie(id);
    } catch (err) {
      console.error(`  Failed TMDB ID ${id}:`, err);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

main();
