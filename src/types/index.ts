export interface Tag {
  id: number;
  name: string;
  createdAt?: string;
  movieCount?: number;
}

export interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  tmdbStillPath: string | null;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  createdAt: string;
}

export interface Season {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface Movie {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  published: boolean;
  durationSeconds: number | null;
  releaseDate: string | null;
  tmdbId: number | null;
  originalLanguage: string | null;
  tags?: Tag[];
  createdAt?: string;
}

export interface Series {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tmdbId: number | null;
  tags?: Tag[];
  seasons?: Season[];
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface MovieCardData {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progressSeconds?: number;
  durationSeconds?: number;
}

export interface Top10RowItem {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export interface Comment {
  id: number;
  movieId: number;
  userId: string;
  content: string;
  createdAt: string;
  user: { name: string; image: string | null };
}

export interface MovieRequest {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  status: "pending" | "fulfilled";
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
}

export interface Report {
  id: number;
  movieId: number;
  userId: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  movie: { title: string; slug: string };
}

export interface Signup {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: string | Date;
}

export interface FeaturedItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate?: string | null;
  durationSeconds?: number | null;
  tags: { id: number; name: string }[];
}

export interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
  seasons: Season[];
}

export interface MostFavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favCount: number;
}

export interface ShortResponse {
  id: number;
  title: string;
  mp4Url: string;
  posterUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShortsPage {
  data: ShortResponse[];
  nextCursor: number | null;
  hasMore: boolean;
}
