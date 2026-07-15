import { pgTable, foreignKey, unique, serial, integer, timestamp, index, varchar, text, date, uniqueIndex, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const featuredMovies = pgTable("featured_movies", {
	id: serial().primaryKey().notNull(),
	movieId: integer("movie_id").notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "featured_movies_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	unique("featured_movies_movie_id_unique").on(table.movieId),
]);

export const movies = pgTable("movies", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	videoUrl: text("video_url"),
	thumbnailUrl: text("thumbnail_url").notNull(),
	durationSeconds: integer("duration_seconds"),
	releaseDate: date("release_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	tmdbId: integer("tmdb_id"),
	originalLanguage: varchar("original_language", { length: 10 }),
	backdropUrl: text("backdrop_url"),
	trailerUrl: text("trailer_url"),
}, (table) => [
	index("idx_movies_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_movies_release_date").using("btree", table.releaseDate.asc().nullsLast().op("date_ops")),
	index("idx_movies_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
	unique("movies_slug_unique").on(table.slug),
	unique("movies_tmdb_id_unique").on(table.tmdbId),
]);

export const movieRequests = pgTable("movie_requests", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	externalLink: text("external_link"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_movie_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_movie_requests_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "movie_requests_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	password: text(),
}, (table) => [
	uniqueIndex("provider_account_unique").using("btree", table.providerId.asc().nullsLast().op("text_ops"), table.accountId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const people = pgTable("people", {
	id: integer().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	profileUrl: text("profile_url"),
}, (table) => [
	index("idx_people_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const videoReports = pgTable("video_reports", {
	id: serial().primaryKey().notNull(),
	movieId: integer("movie_id").notNull(),
	userId: text("user_id").notNull(),
	description: text().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_video_reports_movie_id").using("btree", table.movieId.asc().nullsLast().op("int4_ops")),
	index("idx_video_reports_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "video_reports_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "video_reports_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const movieComments = pgTable("movie_comments", {
	id: serial().primaryKey().notNull(),
	movieId: integer("movie_id").notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_movie_comments_movie_id").using("btree", table.movieId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "movie_comments_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "movie_comments_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	role: text().default('user').notNull(),
	banned: boolean().default(false).notNull(),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
	coverImage: text("cover_image"),
}, (table) => [
	index("idx_user_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
});

export const tags = pgTable("tags", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const seasons = pgTable("seasons", {
	id: serial().primaryKey().notNull(),
	seriesId: integer("series_id").notNull(),
	seasonNumber: integer("season_number").notNull(),
	title: varchar({ length: 255 }),
	description: text(),
	thumbnailUrl: text("thumbnail_url"),
	releaseDate: date("release_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_seasons_series_id").using("btree", table.seriesId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_series_season").using("btree", table.seriesId.asc().nullsLast().op("int4_ops"), table.seasonNumber.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.seriesId],
			foreignColumns: [series.id],
			name: "seasons_series_id_series_id_fk"
		}).onDelete("cascade"),
]);

export const episodes = pgTable("episodes", {
	id: serial().primaryKey().notNull(),
	seasonId: integer("season_id").notNull(),
	episodeNumber: integer("episode_number").notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	videoUrl: text("video_url"),
	thumbnailUrl: text("thumbnail_url"),
	backdropUrl: text("backdrop_url"),
	durationSeconds: integer("duration_seconds"),
	releaseDate: date("release_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_episodes_season_id").using("btree", table.seasonId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_season_episode").using("btree", table.seasonId.asc().nullsLast().op("int4_ops"), table.episodeNumber.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.seasonId],
			foreignColumns: [seasons.id],
			name: "episodes_season_id_seasons_id_fk"
		}).onDelete("cascade"),
	unique("episodes_slug_unique").on(table.slug),
]);

export const featuredSeries = pgTable("featured_series", {
	id: serial().primaryKey().notNull(),
	seriesId: integer("series_id").notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_featured_series_series_id").using("btree", table.seriesId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.seriesId],
			foreignColumns: [series.id],
			name: "featured_series_series_id_series_id_fk"
		}).onDelete("cascade"),
]);

export const series = pgTable("series", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	thumbnailUrl: text("thumbnail_url").notNull(),
	backdropUrl: text("backdrop_url"),
	releaseDate: date("release_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	trailerUrl: text("trailer_url"),
	tmdbId: integer("tmdb_id"),
	originalLanguage: varchar("original_language", { length: 10 }),
}, (table) => [
	unique("series_slug_unique").on(table.slug),
	unique("series_tmdb_id_unique").on(table.tmdbId),
]);

export const movieTags = pgTable("movie_tags", {
	movieId: integer("movie_id").notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => [
	index("idx_movie_tags_movie_id").using("btree", table.movieId.asc().nullsLast().op("int4_ops")),
	index("idx_movie_tags_tag_id").using("btree", table.tagId.asc().nullsLast().op("int4_ops")),
	index("idx_movie_tags_tag_id_movie_id").using("btree", table.tagId.asc().nullsLast().op("int4_ops"), table.movieId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "movie_tags_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "movie_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.tagId, table.movieId], name: "movie_tags_movie_id_tag_id_pk"}),
]);

export const seriesTags = pgTable("series_tags", {
	seriesId: integer("series_id").notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.seriesId],
			foreignColumns: [series.id],
			name: "series_tags_series_id_series_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "series_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.tagId, table.seriesId], name: "series_tags_series_id_tag_id_pk"}),
]);

export const favorites = pgTable("favorites", {
	userId: text("user_id").notNull(),
	movieId: integer("movie_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_favorites_movie_id").using("btree", table.movieId.asc().nullsLast().op("int4_ops")),
	index("idx_favorites_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "favorites_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "favorites_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.movieId], name: "favorites_user_id_movie_id_pk"}),
]);

export const movieCrew = pgTable("movie_crew", {
	movieId: integer("movie_id").notNull(),
	personId: integer("person_id").notNull(),
	department: varchar({ length: 100 }).notNull(),
	job: varchar({ length: 100 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "movie_crew_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.personId],
			foreignColumns: [people.id],
			name: "movie_crew_person_id_people_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.personId, table.movieId, table.job, table.department], name: "movie_crew_movie_id_person_id_department_job_pk"}),
]);

export const movieCast = pgTable("movie_cast", {
	movieId: integer("movie_id").notNull(),
	personId: integer("person_id").notNull(),
	characterName: varchar("character_name", { length: 255 }).notNull(),
	orderBilling: integer("order_billing"),
}, (table) => [
	foreignKey({
			columns: [table.movieId],
			foreignColumns: [movies.id],
			name: "movie_cast_movie_id_movies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.personId],
			foreignColumns: [people.id],
			name: "movie_cast_person_id_people_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.personId, table.movieId, table.characterName], name: "movie_cast_movie_id_person_id_character_name_pk"}),
]);
