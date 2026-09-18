import { relations } from "drizzle-orm/relations";
import { movies, featuredMovies, user, movieRequests, account, session, videoReports, movieComments, movieTags, tags, watchlist } from "./schema";

export const featuredMoviesRelations = relations(featuredMovies, ({one}) => ({
	movie: one(movies, {
		fields: [featuredMovies.movieId],
		references: [movies.id]
	}),
}));

export const moviesRelations = relations(movies, ({many}) => ({
	featuredMovies: many(featuredMovies),
	videoReports: many(videoReports),
	movieComments: many(movieComments),
	movieTags: many(movieTags),
	watchlists: many(watchlist),
}));

export const movieRequestsRelations = relations(movieRequests, ({one}) => ({
	user: one(user, {
		fields: [movieRequests.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	movieRequests: many(movieRequests),
	accounts: many(account),
	sessions: many(session),
	videoReports: many(videoReports),
	movieComments: many(movieComments),
	watchlists: many(watchlist),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const videoReportsRelations = relations(videoReports, ({one}) => ({
	movie: one(movies, {
		fields: [videoReports.movieId],
		references: [movies.id]
	}),
	user: one(user, {
		fields: [videoReports.userId],
		references: [user.id]
	}),
}));

export const movieCommentsRelations = relations(movieComments, ({one}) => ({
	movie: one(movies, {
		fields: [movieComments.movieId],
		references: [movies.id]
	}),
	user: one(user, {
		fields: [movieComments.userId],
		references: [user.id]
	}),
}));

export const movieTagsRelations = relations(movieTags, ({one}) => ({
	movie: one(movies, {
		fields: [movieTags.movieId],
		references: [movies.id]
	}),
	tag: one(tags, {
		fields: [movieTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	movieTags: many(movieTags),
}));

export const watchlistRelations = relations(watchlist, ({one}) => ({
	user: one(user, {
		fields: [watchlist.userId],
		references: [user.id]
	}),
	movie: one(movies, {
		fields: [watchlist.movieId],
		references: [movies.id]
	}),
}));