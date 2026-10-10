export const cacheKeys = {
  movie: (slug: string) => `movie:${slug}`,
  related: (slug: string) => `related:${slug}`,
  moviesSearch: (q: string, tagsParam: string, page: number, limit: number, sortBy: string, sortDir: string) =>
    `movies:search:${q}:${tagsParam}:${page}:${limit}:${sortBy}:${sortDir}`,
  tag: (slug: string) => `tag:${slug}`,
  tagsAll: "tags:all",
  tagMovies: (slug: string, page: number, limit: number) =>
    `tag-movies:${slug}:${page}:${limit}`,
  comments: (slug: string, page: number, limit: number) =>
    `comments:${slug}:${page}:${limit}`,
  commentsPrefix: (slug: string) => `comments:${slug}:`,
  watchlist: (userId: string, page: number, limit: number) =>
    `watchlist:user:${userId}:${page}:${limit}`,
  homeFeatured: (key: string) => `home:featured-${key}`,
  homeTop10: "home:top10-movies",
  searchAutocomplete: (q: string) => `search:autocomplete:${q.toLowerCase().trim()}`,
  shorts: (limit: number, cursor?: number) => `shorts:list:${limit}:${cursor ?? "first"}`,
  adminStats: "admin:stats",
  adminMostFavorited: (limit: number) => `admin:most-favorited:${limit}`,
} as const;
