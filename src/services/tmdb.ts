import { uploadToIA } from "@/lib/upload-utils";
import { logger } from "@/lib/logger";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    } catch (err) {
      if (i === retries) throw err;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (err as any)?.code;
      const isRetryable =
        err instanceof TypeError ||
        code?.startsWith?.("UND_ERR") || code === "ECONNRESET";

      if (!isRetryable) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
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

interface TMDBTVResult {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  first_air_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: string;
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
  } catch {
    logger.error("tmdb", "Failed to fetch movie trailer");
    return null;
  }
}

export async function searchTMDBTV(query: string): Promise<TMDBTVResult[]> {
  const res = await fetchWithRetry(
    `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=en-US&page=1&api_key=${TMDB_API_KEY}`,
    {
      headers: { accept: "application/json" },
    }
  );
  if (!res.ok) throw new Error("TMDB TV search failed");
  const data = await res.json();
  return (data.results ?? []).slice(0, 10).map((r: Record<string, unknown>) => ({
    id: r.id,
    title: r.name,
    release_date: r.first_air_date ?? "",
    vote_average: r.vote_average ?? 0,
    overview: r.overview ?? "",
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    original_language: r.original_language ?? "",
  }));
}

export async function getTMDBTVDetails(tmdbId: number): Promise<TMDBTVDetails> {
  const res = await fetchWithRetry(`${TMDB_BASE_URL}/tv/${tmdbId}?language=en-US&api_key=${TMDB_API_KEY}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("TMDB TV details fetch failed");
  const r = await res.json();
  return {
    id: r.id,
    name: r.name,
    first_air_date: r.first_air_date ?? "",
    vote_average: r.vote_average ?? 0,
    overview: r.overview ?? "",
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    original_language: r.original_language ?? "",
    numberOfSeasons: r.number_of_seasons ?? 0,
    numberOfEpisodes: r.number_of_episodes ?? 0,
    status: r.status ?? "",
  };
}

export async function getTMDBTVTrailer(tmdbId: number): Promise<string | null> {
  try {
    const res = await fetchWithRetry(
      `${TMDB_BASE_URL}/tv/${tmdbId}/videos?language=en-US&api_key=${TMDB_API_KEY}`,
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
  } catch {
    logger.error("tmdb", "Failed to fetch TV trailer");
    return null;
  }
}

export interface TMDBSeasonEpisode {
  episodeNumber: number;
  title: string;
  overview: string;
  stillPath: string | null;
  airDate: string | null;
  runtimeMinutes: number | null;
}

export interface TMDBSeasonDetails {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  seasonNumber: number;
  airDate: string | null;
  episodes: TMDBSeasonEpisode[];
}

export async function getTMDBTVSeason(tmdbId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
  const res = await fetchWithRetry(
    `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?language=en-US&api_key=${TMDB_API_KEY}`,
    { headers: { accept: "application/json" } }
  );
  if (!res.ok) throw new Error("TMDB season fetch failed");
  const r = await res.json();
  return {
    id: r._id,
    name: r.name ?? "",
    overview: r.overview ?? "",
    posterPath: r.poster_path,
    seasonNumber: r.season_number,
    airDate: r.air_date ?? null,
    episodes: (r.episodes ?? []).map((ep: Record<string, unknown>) => ({
      episodeNumber: ep.episode_number,
      title: ep.name,
      overview: ep.overview ?? "",
      stillPath: ep.still_path ?? null,
      airDate: ep.air_date ?? null,
      runtimeMinutes: ep.runtime ?? null,
    })),
  };
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
  } catch {
    logger.error("tmdb", "Failed to download image from TMDB");
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
  } catch {
    logger.error("tmdb", "Failed to upload image");
    return null;
  }
}
