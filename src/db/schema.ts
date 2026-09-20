import { pgTable, text, timestamp, boolean, uniqueIndex, integer, serial, varchar, date, primaryKey, index } from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  coverImage: text("cover_image"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (t) => [
  index("idx_user_role").on(t.role),
]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  impersonatedBy: text("impersonated_by"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (t) => [
  index("idx_session_user_id").on(t.userId),
  index("idx_session_expires_at").on(t.expiresAt),
]);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    userIdx: index("idx_account_user_id").on(table.userId),
  })
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (t) => [
  index("idx_verification_identifier").on(t.identifier),
]);

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  releaseDate: date("release_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tmdbId: integer("tmdb_id").unique(),
  originalLanguage: varchar("original_language", { length: 10 }),
  backdropUrl: text("backdrop_url"),
  trailerUrl: text("trailer_url"),
  published: boolean("published").default(false).notNull(),
}, (t) => [
  index("idx_movies_title_trgm").using("gin", sql`${t.title} gin_trgm_ops`),
  index("idx_movies_published_created_at").on(t.published, t.createdAt.desc()),
  index("idx_movies_created_at").on(t.createdAt),
  index("idx_movies_release_date").on(t.releaseDate),
]);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_tags_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
]);

export const movieTags = pgTable("movie_tags", {
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.movieId, t.tagId] }),
  index("idx_movie_tags_tag_id").on(t.tagId),
  index("idx_movie_tags_movie_id").on(t.movieId),
]);

export const featuredMovies = pgTable("featured_movies", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .unique()
    .references(() => movies.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlist = pgTable("watchlist", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.movieId] }),
  index("idx_watchlist_user_created").on(t.userId, t.createdAt.desc()),
  index("idx_watchlist_movie_id").on(t.movieId),
]);

export const movieRequests = pgTable("movie_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  externalLink: text("external_link"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_movie_requests_user_id").on(t.userId),
  index("idx_movie_requests_status").on(t.status),
  index("idx_movie_requests_title_trgm").using("gin", sql`${t.title} gin_trgm_ops`),
  index("idx_movie_requests_description_trgm").using("gin", sql`${t.description} gin_trgm_ops`),
]);

export const videoReports = pgTable("video_reports", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_video_reports_movie_id").on(t.movieId),
  index("idx_video_reports_status").on(t.status),
  index("idx_video_reports_description_trgm").using("gin", sql`${t.description} gin_trgm_ops`),
]);

export const movieComments = pgTable("movie_comments", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_movie_comments_movie_created").on(t.movieId, t.createdAt.desc()),
  index("idx_movie_comments_user_id").on(t.userId),
]);

export const shorts = pgTable("shorts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mp4Url: text("mp4_url").notNull(),
  posterUrl: text("poster_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const watchProgress = pgTable("watch_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  movieId: integer("movie_id").references(() => movies.id, { onDelete: "cascade" }),
  progressSeconds: integer("progress_seconds").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_watch_progress_user_id").on(t.userId),
  index("idx_watch_progress_user_updated").on(t.userId, t.updatedAt.desc()),
  index("idx_watch_progress_movie_id").on(t.movieId),
  uniqueIndex("idx_watch_progress_user_movie").on(t.userId, t.movieId),
]);

export type VideoReport = InferSelectModel<typeof videoReports>;
export type VideoReportInsert = InferInsertModel<typeof videoReports>;
export type MovieComment = InferSelectModel<typeof movieComments>;
export type MovieCommentInsert = InferInsertModel<typeof movieComments>;
export type Short = InferSelectModel<typeof shorts>;
export type ShortInsert = InferInsertModel<typeof shorts>;
export type WatchProgress = InferSelectModel<typeof watchProgress>;
export type WatchProgressInsert = InferInsertModel<typeof watchProgress>;


