import { relations } from "drizzle-orm/relations";
import { movies, featuredMovies, user, movieRequests, account, session, videoReports, movieComments, series, seasons, featuredSeries, episodes, movieTags, tags, seriesTags, favorites, movieCrew, people, movieCast } from "./schema";

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
	favorites: many(favorites),
	movieCrews: many(movieCrew),
	movieCasts: many(movieCast),
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
	favorites: many(favorites),
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

export const seasonsRelations = relations(seasons, ({one, many}) => ({
	series: one(series, {
		fields: [seasons.seriesId],
		references: [series.id]
	}),
	episodes: many(episodes),
}));

export const seriesRelations = relations(series, ({many}) => ({
	seasons: many(seasons),
	featuredSeries: many(featuredSeries),
	seriesTags: many(seriesTags),
}));

export const featuredSeriesRelations = relations(featuredSeries, ({one}) => ({
	series: one(series, {
		fields: [featuredSeries.seriesId],
		references: [series.id]
	}),
}));

export const episodesRelations = relations(episodes, ({one}) => ({
	season: one(seasons, {
		fields: [episodes.seasonId],
		references: [seasons.id]
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
	seriesTags: many(seriesTags),
}));

export const seriesTagsRelations = relations(seriesTags, ({one}) => ({
	series: one(series, {
		fields: [seriesTags.seriesId],
		references: [series.id]
	}),
	tag: one(tags, {
		fields: [seriesTags.tagId],
		references: [tags.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(user, {
		fields: [favorites.userId],
		references: [user.id]
	}),
	movie: one(movies, {
		fields: [favorites.movieId],
		references: [movies.id]
	}),
}));

export const movieCrewRelations = relations(movieCrew, ({one}) => ({
	movie: one(movies, {
		fields: [movieCrew.movieId],
		references: [movies.id]
	}),
	person: one(people, {
		fields: [movieCrew.personId],
		references: [people.id]
	}),
}));

export const peopleRelations = relations(people, ({many}) => ({
	movieCrews: many(movieCrew),
	movieCasts: many(movieCast),
}));

export const movieCastRelations = relations(movieCast, ({one}) => ({
	movie: one(movies, {
		fields: [movieCast.movieId],
		references: [movies.id]
	}),
	person: one(people, {
		fields: [movieCast.personId],
		references: [people.id]
	}),
}));