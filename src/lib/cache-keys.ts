export const cacheKeys = {
  movie: (slug: string) => `movie:${slug}`,
  related: (slug: string) => `related:${slug}`,
  moviesSearch: (q: string, tagsParam: string, page: number, limit: number, sortBy: string, sortDir: string) =>
    `movies:search:${q}:${tagsParam}:${page}:${limit}:${sortBy}:${sortDir}`,
  tag: (slug: string) => `tag:${slug}`,
  tagsAll: "tags:all",
  tagMovies: (slug: string, cursor: string | undefined, limit: number) =>
    `tag-movies:${slug}:${cursor ?? "first"}:${limit}`,
  comments: (slug: string, cursor: string | undefined, limit: number) =>
    `comments:${slug}:${cursor ?? "first"}:${limit}`,
  commentsPrefix: (slug: string) => `comments:${slug}:`,
  watchlist: (userId: string, cursor: string | undefined, limit: number) =>
    `watchlist:user:${userId}:${cursor ?? "first"}:${limit}`,
  homeFeatured: (key: string) => `home:featured-${key}`,
  homeTop10: "home:top10-movies",
  tmdbNowPlaying: "tmdb:now-playing",
  searchAutocomplete: (q: string) => `search:autocomplete:${q.toLowerCase().trim()}`,
  shorts: (limit: number, cursor?: number) => `shorts:list:${limit}:${cursor ?? "first"}`,
  adminStats: "admin:stats",
  adminMostFavorited: (limit: number) => `admin:most-favorited:${limit}`,
} as const;
