export const DEFAULT_PAGE_SIZE = 12;
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

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

export const SERIES_SORT_OPTIONS: SortOption[] = [
  { label: "Newest", value: "createdAt", dir: "asc" },
  { label: "Oldest", value: "createdAt", dir: "desc" },
  { label: "Title A-Z", value: "title", dir: "asc" },
  { label: "Title Z-A", value: "title", dir: "desc" },
  { label: "Year ↓", value: "releaseDate", dir: "desc" },
  { label: "Year ↑", value: "releaseDate", dir: "asc" },
];
