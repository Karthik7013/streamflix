import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import {
  getTMDBMovieDetails,
  tmdbImageUrl,
  getTMDBMovieTrailer,
} from "@/services/tmdb";
import { validateBody } from "@/lib/api-validation";
import { tmdbImportApiSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const POST = withAdminAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`tmdb:${session.user.id}`, 30, 60_000);
  if (!allowed) return rateLimitResponse();

  const body = await request.json();
  const parsed = validateBody(tmdbImportApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { tmdbId } = parsed.data;

  try {
    const d = await getTMDBMovieDetails(tmdbId);
    const title = d.title;
    const overview = d.overview;
    const release = d.release_date;
    const duration = d.runtimeMinutes ? d.runtimeMinutes * 60 : null;
    const language = d.original_language;

    const trailerUrl = await getTMDBMovieTrailer(tmdbId);

    return NextResponse.json({
      title,
      overview,
      releaseDate: release,
      originalLanguage: language,
      tmdbId,
      durationSeconds: duration,
      thumbnailUrl: tmdbImageUrl(d.poster_path),
      backdropUrl: tmdbImageUrl(d.backdrop_path, "w1280"),
      trailerUrl,
    }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  } catch (err) {
    logger.error("admin/tmdb/import", "TMDB import error:", err);
    const message = err instanceof Error ? err.message : "TMDB import failed";
    return NextResponse.json({ error: { message, code: ErrorCode.ImportFailed } }, { status: 500 });
  }
});
