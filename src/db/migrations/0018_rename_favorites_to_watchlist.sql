ALTER TABLE "favorites" RENAME TO "watchlist";
ALTER INDEX "idx_favorites_user_created" RENAME TO "idx_watchlist_user_created";
ALTER INDEX "idx_favorites_movie_id" RENAME TO "idx_watchlist_movie_id";
ALTER INDEX "favorites_user_id_movie_id_pk" RENAME TO "watchlist_user_id_movie_id_pk";
ALTER TABLE "watchlist" RENAME CONSTRAINT "favorites_user_id_user_id_fk" TO "watchlist_user_id_user_id_fk";
ALTER TABLE "watchlist" RENAME CONSTRAINT "favorites_movie_id_movies_id_fk" TO "watchlist_movie_id_movies_id_fk";
