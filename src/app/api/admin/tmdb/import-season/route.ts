import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getTMDBTVSeason, downloadAndUploadImage } from "@/services/tmdb";
import { createSeason, getSeasonsBySeriesId } from "@/services/seasons";
import { createEpisode } from "@/services/episodes";
import { generateSlug } from "@/lib/validation";
import { logger } from "@/lib/logger";

const CONCURRENCY = 5;

export const POST = withAdminAuth(async (request) => {
  const { tmdbId, seriesId, seasonNumber } = await request.json();
  if (!tmdbId || !seriesId || !seasonNumber) {
    return NextResponse.json({ error: { message: "tmdbId, seriesId, and seasonNumber are required", code: "REQUIRED" } }, { status: 400 });
  }

  try {
    const existingSeasons = await getSeasonsBySeriesId(seriesId);
    const existing = existingSeasons.find((s) => s.seasonNumber === seasonNumber);
    if (existing) {
      return NextResponse.json({ error: { message: `Season ${seasonNumber} already exists`, code: "SEASON_EXISTS" } }, { status: 409 });
    }

    const seasonData = await getTMDBTVSeason(tmdbId, seasonNumber);

    const seasonThumbnailKey = seasonData.posterPath
      ? await downloadAndUploadImage(seasonData.posterPath, "thumbnails")
      : null;

    const createdSeason = await createSeason(seriesId, {
      seasonNumber: seasonData.seasonNumber,
      title: seasonData.name || undefined,
      description: seasonData.overview || null,
      thumbnailUrl: seasonThumbnailKey || null,
      releaseDate: seasonData.airDate || null,
    });

    let imported = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      seasonData.episodes.map((ep, i) =>
        (async () => {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, Math.floor(i / CONCURRENCY) * 100)
          );

          const epSlug = generateSlug(`${seasonData.seasonNumber}-${ep.episodeNumber}-${ep.title}`);
          await createEpisode(createdSeason.id, {
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            slug: epSlug,
            description: ep.overview || null,
            tmdbStillPath: ep.stillPath,
            durationSeconds: ep.runtimeMinutes ? ep.runtimeMinutes * 60 : null,
            releaseDate: ep.airDate || null,
          });
        })()
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        imported++;
      } else {
        logger.error("tmdb/import-season", "Episode import failed", r.reason);
        failed++;
      }
    }

    return NextResponse.json({
      season: createdSeason,
      imported,
      failed,
    });
  } catch (err) {
    logger.error("admin/tmdb/import-season", "TMDB season import error:", err);
    const message = err instanceof Error ? err.message : "TMDB season import failed";
    return NextResponse.json({ error: { message, code: "IMPORT_FAILED" } }, { status: 500 });
  }
});
