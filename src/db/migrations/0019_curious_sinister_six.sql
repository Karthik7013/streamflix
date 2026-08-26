ALTER TABLE "tags" ADD COLUMN "slug" varchar(50);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "image_url" text;--> statement-breakpoint
UPDATE "tags" SET "slug" = LOWER(REPLACE(REPLACE("name", ' ', '-'), '.', '')) WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "title_search" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("title", ''))) STORED;--> statement-breakpoint
CREATE INDEX "idx_movies_title_search" ON "movies" USING GIN ("title_search");
