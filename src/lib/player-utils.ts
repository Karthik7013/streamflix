export function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00"
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function episodeThumbnail(ep: { thumbnailUrl?: string | null; tmdbStillPath?: string | null }): string | null {
  if (ep.thumbnailUrl) return ep.thumbnailUrl;
  if (ep.tmdbStillPath) return `${TMDB_IMAGE_BASE}/w500${ep.tmdbStillPath}`;
  return null;
}


