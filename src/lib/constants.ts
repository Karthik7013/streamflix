export const DEFAULT_PAGE_SIZE = 12;
export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const STATUS_PAGE_URL = "https://streamflix-studio.instatus.com";
export const TOP_10_LIMIT = 10;
export const ADMIN_USERS_LIMIT = 50;
export const ADMIN_MOVIES_LIMIT = 20;
export const TMDB_TIMEOUT_MS = 30_000;
export const TMDB_RETRY_COUNT = 2;

export interface SortOption {
  label: string;
  value: string;
  dir: "asc" | "desc";
}

export const MOVIE_SORT_OPTIONS: SortOption[] = [
  { label: "Newest", value: "createdAt", dir: "asc" },
  { label: "Oldest", value: "createdAt", dir: "desc" },
  { label: "Title A-Z", value: "title", dir: "asc" },
  { label: "Title Z-A", value: "title", dir: "desc" },
  { label: "Shortest", value: "durationSeconds", dir: "asc" },
  { label: "Longest", value: "durationSeconds", dir: "desc" },
  { label: "Year ↓", value: "releaseDate", dir: "desc" },
  { label: "Year ↑", value: "releaseDate", dir: "asc" },
];

