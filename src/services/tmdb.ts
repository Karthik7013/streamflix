import { logger } from "@/lib/logger";
import { TMDB_TIMEOUT_MS, TMDB_RETRY_COUNT } from "@/lib/constants";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";

function getTmdbApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY environment variable is not set");
  return key;
}
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbImageUrl(path: string | null, size: "w500" | "w1280" = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

const NOW_PLAYING_NEGATIVE_CACHE_MS = 60_000;
let nowPlayingFailedAt = 0;

export async function getTmdbNowPlaying(): Promise<string[]> {
  if (Date.now() - nowPlayingFailedAt < NOW_PLAYING_NEGATIVE_CACHE_MS) return [];
  try {
    return await cacheGetOrSet(cacheKeys.tmdbNowPlaying, CACHE_TTL.SLOW, async () => {
      const res = await fetchWithRetry(
        `${TMDB_BASE_URL}/movie/now_playing?language=en-US&page=1&api_key=${getTmdbApiKey()}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error("TMDB now playing failed");
      const data = await res.json();
      return ((data.results ?? []) as { poster_path: string | null }[])
        .map((r) => (r.poster_path ? `${TMDB_IMAGE_BASE}/w342${r.poster_path}` : null))
        .filter((u): u is string => u !== null);
    });
  } catch (err) {
    nowPlayingFailedAt = Date.now();
    logger.error("tmdb", "Failed to fetch now playing", err);
    throw err;
  }
}

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


export interface TMDBPersonDetails {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  gender: number | null;
  known_for_department: string | null;
  popularity: number | null;
}

export interface TMDBPersonCredit {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string | null;
  job?: string | null;
  department?: string | null;
  order?: number | null;
}

export interface TMDBPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number | null;
}

export interface TMDBMovieCredits {
  cast: TMDBPersonCredit[];
  crew: TMDBPersonCredit[];
}

export async function searchTMDB(query: string): Promise<TMDBMovieResult[]> {
  const res = await fetchWithRetry(
    `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1&api_key=${getTmdbApiKey()}`,
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
  const res = await fetchWithRetry(`${TMDB_BASE_URL}/movie/${tmdbId}?language=en-US&api_key=${getTmdbApiKey()}`, {
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
      `${TMDB_BASE_URL}/movie/${tmdbId}/videos?language=en-US&api_key=${getTmdbApiKey()}`,
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

export async function getTMDBPersonDetails(tmdbId: number): Promise<TMDBPersonDetails> {
  const res = await fetchWithRetry(`${TMDB_BASE_URL}/person/${tmdbId}?language=en-US&api_key=${getTmdbApiKey()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("TMDB person details fetch failed");
  const r = await res.json();
  return {
    id: r.id,
    name: r.name ?? "",
    profile_path: r.profile_path,
    biography: r.biography ?? null,
    birthday: r.birthday ?? null,
    deathday: r.deathday ?? null,
    gender: r.gender ?? null,
    known_for_department: r.known_for_department ?? null,
    popularity: r.popularity ?? null,
  };
}

export async function getTMDBMovieCredits(tmdbId: number): Promise<TMDBMovieCredits> {
  const res = await fetchWithRetry(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?language=en-US&api_key=${getTmdbApiKey()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("TMDB movie credits fetch failed");
  const data = await res.json();
  const normalize = (r: Record<string, unknown>): TMDBPersonCredit => ({
    id: r.id,
    name: r.name,
    profile_path: r.profile_path,
    character: r.character ?? null,
    job: r.job ?? null,
    department: r.department ?? null,
    order: typeof r.order === "number" ? r.order : null,
  });
  return {
    cast: (data.cast ?? []).map(normalize),
    crew: (data.crew ?? []).map(normalize),
  };
}

export async function searchTMDbPeople(query: string): Promise<TMDBPersonResult[]> {
  const res = await fetchWithRetry(
    `${TMDB_BASE_URL}/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1&api_key=${getTmdbApiKey()}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error("TMDB person search failed");
  const data = await res.json();
  return (data.results ?? []).slice(0, 10).map((r: Record<string, unknown>) => ({
    id: r.id,
    name: r.name,
    profile_path: r.profile_path,
    known_for_department: r.known_for_department,
    popularity: r.popularity,
  }));
}
