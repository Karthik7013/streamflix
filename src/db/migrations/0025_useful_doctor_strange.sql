CREATE INDEX "idx_featured_movies_display_order" ON "featured_movies" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "idx_movie_requests_status_created_at" ON "movie_requests" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_movies_slug_trgm" ON "movies" USING gin ("slug" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_movies_description_trgm" ON "movies" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_movies_published_title" ON "movies" USING btree ("published","title");--> statement-breakpoint
CREATE INDEX "idx_user_created_at" ON "user" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_verification_expires_at" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_video_reports_user_id" ON "video_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_video_reports_status_created_at" ON "video_reports" USING btree ("status","created_at" DESC NULLS LAST);