import { uploadToIA } from "@/lib/upload-utils";
import { logger } from "@/lib/logger";
import { TMDB_TIMEOUT_MS, TMDB_RETRY_COUNT } from "@/lib/constants";

const TMDB_API_KEY = (() => {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY environment variable is not set");
  return key;
})();
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

async function fetchWithRetry(url: string, init?: RequestInit, retries = TMDB_RETRY_COUNT): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TMDB_TIMEOUT_MS) });
      if (res.status === 429 && i < retries) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "1", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok && i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries) throw err;
      const code = err instanceof Error && "code" in err ? (err as { code?: string }).code : undefined;
      const isRetryable =
        err instanceof TypeError ||
        code?.startsWith?.("UND_ERR") || code === "ECONNRESET";
      if (!isRetryable) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}

interface TMDBMovieResult {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  runtimeMinutes: number | null;
}


export async function searchTMDB(query: string): Promise<TMDBMovieResult[]> {
  const res = await fetchWithRetry(
    `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1&api_key=${TMDB_API_KEY}`,
    {
      headers: { accept: "application/json" },
    }
  );
  if (!res.ok) throw new Error("TMDB search failed");
  const data = await res.json();
  return (data.results ?? []).slice(0, 10).map((r: Record<string, unknown>) => ({
    id: r.id,
    title: r.title,
    release_date: r.release_date ?? "",
    vote_average: r.vote_average ?? 0,
    overview: r.overview ?? "",
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    original_language: r.original_language ?? "",
  }));
}

export async function getTMDBMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
  const res = await fetchWithRetry(`${TMDB_BASE_URL}/movie/${tmdbId}?language=en-US&api_key=${TMDB_API_KEY}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("TMDB details fetch failed");
  const r = await res.json();
  return {
    id: r.id,
    title: r.title,
    release_date: r.release_date ?? "",
    vote_average: r.vote_average ?? 0,
    overview: r.overview ?? "",
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    original_language: r.original_language ?? "",
    runtimeMinutes: r.runtime ?? null,
  };
}

export async function getTMDBMovieTrailer(tmdbId: number): Promise<string | null> {
  try {
    const res = await fetchWithRetry(
      `${TMDB_BASE_URL}/movie/${tmdbId}/videos?language=en-US&api_key=${TMDB_API_KEY}`,
      { headers: { accept: "application/json" } },
      1
    );
    if (!res.ok) return null;
    const data = await res.json();
    const videos: { site: string; type: string; key: string }[] = data.results ?? [];
    const trailer = videos.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    ) ?? videos.find(
      (v) => v.site === "YouTube" && v.type === "Teaser"
    );
    if (!trailer) return null;
    return `https://www.youtube.com/embed/${trailer.key}`;
  } catch (err) {
    logger.error("tmdb", "Failed to fetch movie trailer", err);
    return null;
  }
}

export async function downloadAndUploadImage(
  tmdbPath: string | null,
  folder: string,
  key?: string
): Promise<string | null> {
  if (!tmdbPath) return null;
  const size = folder === "backdrops" ? "w1280" : "w500";
  const imageUrl = `${TMDB_IMAGE_BASE}/${size}${tmdbPath}`;

  let imageRes: Response;
  try {
    imageRes = await fetchWithRetry(imageUrl, undefined, 1);
  } catch (err) {
    logger.error("tmdb", "Failed to download image from TMDB", err);
    return null;
  }
  if (!imageRes.ok) return null;

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const contentType = imageRes.headers.get("content-type") || "image/jpeg";
  const ext = contentType === "image/png" ? "png" : "jpg";
  const fileName = key ? `avatar.${ext}` : `tmdb-${Date.now()}.${ext}`;

  try {
    const { publicUrl } = await uploadToIA({ fileName, buffer, contentType, folder, key });
    return publicUrl;
  } catch (err) {
    logger.error("tmdb", "Failed to upload image", err);
    return null;
  }
}
