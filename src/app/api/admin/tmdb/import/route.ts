import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getTMDBMovieDetails, downloadAndUploadImage, getTMDBMovieTrailer } from "@/services/tmdb";

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tmdbId, slug, releaseDate } = await request.json();
    if (!tmdbId || typeof tmdbId !== "number") {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 });
    }

    const details = await getTMDBMovieDetails(tmdbId);

    const year = slug && releaseDate ? new Date(releaseDate).getFullYear() : null;
    const thumbnailKey = slug ? `movies/${year}/${slug}/thumbnails/01.jpg` : undefined;
    const backdropKey = slug ? `movies/${year}/${slug}/backdrops/01.jpg` : undefined;

    const [thumbnailUrl, backdropUrl, trailerUrl] = await Promise.all([
      downloadAndUploadImage(details.poster_path, "thumbnails", thumbnailKey),
      downloadAndUploadImage(details.backdrop_path, "backdrops", backdropKey),
      getTMDBMovieTrailer(tmdbId),
    ]);

    return NextResponse.json({
      title: details.title,
      overview: details.overview,
      releaseDate: details.release_date,
      originalLanguage: details.original_language,
      tmdbId: details.id,
      durationSeconds: details.runtimeMinutes ? details.runtimeMinutes * 60 : null,
      thumbnailUrl,
      backdropUrl,
      trailerUrl,
    });
  } catch (err) {
    console.error("TMDB import error:", err);
    const message = err instanceof Error ? err.message : "TMDB import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
