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
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieCardData {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progressSeconds?: number;
  durationSeconds?: number;
}

export interface FeaturedItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  tags: Tag[];
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
  status: string;
  createdAt: string;
  user: { name: string; email: string };
}

export interface RequestUser {
  name: string;
  email: string;
}

export interface Report {
  id: number;
  movieId: number;
  userId: string;
  reason: string;
  status: string;
  createdAt: string;
  user: { name: string };
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

export interface FavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favCount: number;
}
