CREATE INDEX "idx_tags_name_trgm" ON "tags" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_movie_requests_title_trgm" ON "movie_requests" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_movie_requests_description_trgm" ON "movie_requests" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_video_reports_description_trgm" ON "video_reports" USING gin ("description" gin_trgm_ops);
