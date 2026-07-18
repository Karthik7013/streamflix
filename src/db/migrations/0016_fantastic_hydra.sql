DROP INDEX IF EXISTS "idx_favorites_user_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_movie_comments_movie_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_favorites_user_created" ON "favorites" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_comments_movie_created" ON "movie_comments" USING btree ("movie_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_comments_user_id" ON "movie_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movies_published_created_at" ON "movies" USING btree ("published","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_series_created_at" ON "series" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_series_title_trgm" ON "series" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_series_tags_tag_id" ON "series_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_user_id" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_user_id" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "user" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_reports_created_at" ON "video_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_requests_created_at" ON "movie_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_cast_person_id" ON "movie_cast" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_crew_person_id" ON "movie_crew" USING btree ("person_id");