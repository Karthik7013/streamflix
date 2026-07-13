import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import {
  getTMDBMovieDetails, getTMDBTVDetails,
  downloadAndUploadImage,
  getTMDBMovieTrailer, getTMDBTVTrailer,
} from "@/services/tmdb";
import { logger } from "@/lib/logger";

export const POST = withAdminAuth(async (request) => {
  const { tmdbId, slug, releaseDate, mediaType = "movie" } = await request.json();
  if (!tmdbId || typeof tmdbId !== "number") {
    return NextResponse.json({ error: { message: "tmdbId is required", code: "TMDB_ID_REQUIRED" } }, { status: 400 });
  }

  const isTV = mediaType === "tv";
  const folder = isTV ? "series" : "movies";

  let title: string;
  let overview: string;
  let release: string;
  let duration: number | null;
  let poster: string | null;
  let backdrop: string | null;
  let language: string;

  try {
    if (isTV) {
      const d = await getTMDBTVDetails(tmdbId);
      title = d.name;
      overview = d.overview;
      release = d.first_air_date;
      duration = null;
      poster = d.poster_path;
      backdrop = d.backdrop_path;
      language = d.original_language;
    } else {
      const d = await getTMDBMovieDetails(tmdbId);
      title = d.title;
      overview = d.overview;
      release = d.release_date;
      duration = d.runtimeMinutes ? d.runtimeMinutes * 60 : null;
      poster = d.poster_path;
      backdrop = d.backdrop_path;
      language = d.original_language;
    }

    const year = slug && releaseDate ? new Date(releaseDate).getFullYear() : null;
    const thumbnailKey = slug && year ? `${folder}/${year}/${slug}/thumbnails/01.jpg` : undefined;
    const backdropKey = slug && year ? `${folder}/${year}/${slug}/backdrops/01.jpg` : undefined;

    const [thumbnailUrl, backdropUrl, trailerUrl] = await Promise.all([
      downloadAndUploadImage(poster, "thumbnails", thumbnailKey),
      downloadAndUploadImage(backdrop, "backdrops", backdropKey),
      isTV ? getTMDBTVTrailer(tmdbId) : getTMDBMovieTrailer(tmdbId),
    ]);

    return NextResponse.json({
      title,
      overview,
      releaseDate: release,
      originalLanguage: language,
      tmdbId,
      durationSeconds: duration,
      thumbnailUrl,
      backdropUrl,
      trailerUrl,
    });
  } catch (err) {
    logger.error("admin/tmdb/import", "TMDB import error:", err);
    const message = err instanceof Error ? err.message : "TMDB import failed";
    return NextResponse.json({ error: { message, code: "IMPORT_FAILED" } }, { status: 500 });
  }
});
