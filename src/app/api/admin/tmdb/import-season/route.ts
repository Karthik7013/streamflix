import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getTMDBTVSeason, downloadAndUploadImage } from "@/services/tmdb";
import { createSeason, getSeasonsBySeriesId } from "@/services/seasons";
import { createEpisode } from "@/services/episodes";
import { generateSlug } from "@/lib/validation";
import { validateBody } from "@/lib/api-validation";
import { tmdbImportSeasonApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

const CONCURRENCY = 5;

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const parsed = validateBody(tmdbImportSeasonApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { tmdbId, seriesId, seasonNumber } = parsed.data;

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

    await invalidateCache("series-detail");
    await invalidateCache("series-list");

    return NextResponse.json(
      { season: createdSeason, imported, failed },
      { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
    );
  } catch (err) {
    logger.error("admin/tmdb/import-season", "TMDB season import error:", err);
    const message = err instanceof Error ? err.message : "TMDB season import failed";
    return NextResponse.json({ error: { message, code: "IMPORT_FAILED" } }, { status: 500 });
  }
});
