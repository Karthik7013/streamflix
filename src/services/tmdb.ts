import { uploadToIA } from "@/lib/upload-utils";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

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
  const res = await fetch(
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
  const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?language=en-US&api_key=${TMDB_API_KEY}`, {
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

export async function downloadAndUploadImage(
  tmdbPath: string | null,
  folder: string
): Promise<string | null> {
  if (!tmdbPath) return null;
  const size = folder === "backdrops" ? "w1280" : "w500";
  const imageUrl = `${TMDB_IMAGE_BASE}/${size}${tmdbPath}`;

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) return null;

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const contentType = imageRes.headers.get("content-type") || "image/jpeg";
  const ext = contentType === "image/png" ? "png" : "jpg";
  const fileName = `tmdb-${Date.now()}.${ext}`;

  const { publicUrl } = await uploadToIA({ fileName, buffer, contentType, folder });
  return publicUrl;
}
