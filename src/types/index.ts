export interface Tag {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  createdAt?: string;
  movieCount?: number;
}

export interface Person {
  id: number;
  name: string;
  slug: string;
  tmdbId: number | null;
  profileUrl: string | null;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  gender: number | null;
  knownForDepartment: string | null;
  popularity: number | null;
  createdAt: string;
  updatedAt: string;
  movieCount?: number;
}

export interface MovieCredit {
  id: number;
  movieId: number;
  personId: number;
  roleType: "cast" | "crew";
  department: string | null;
  job: string | null;
  character: string | null;
  creditOrder: number | null;
  person: {
    id: number;
    name: string;
    slug: string;
    profileUrl: string | null;
    tmdbId: number | null;
    knownForDepartment: string | null;
  };
}

export interface MovieCreditsPage {
  data: MovieCredit[];
  meta: PaginationMeta;
}

export interface PersonCredits {
  cast: MovieCredit[];
  crew: MovieCredit[];
}

export interface TMDBPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  popularity: number | null;
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
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
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
}

export interface MovieDetail extends Movie {
  related: MovieCardData[];
  credits: PersonCredits;
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

export interface CommentsPage {
  data: {
    id: number;
    content: string;
    createdAt: string;
    user: { id: string; name: string; image: string | null };
  }[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
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
  tags: { id: number; name: string; slug: string }[];
}

export interface MostFavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favCount: number;
}

export interface RecentSignup {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  original_language: string;
}

export interface TmdbImportResult {  title: string;
  overview: string;
  releaseDate: string;
  originalLanguage: string;
  tmdbId: number;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
}

export interface AdminFeaturedItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  movieId: number;
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
