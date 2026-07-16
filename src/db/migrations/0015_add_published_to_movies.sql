ALTER TABLE "movies" ADD COLUMN "published" boolean DEFAULT false NOT NULL;

-- Set existing movies with video_url to published=true
UPDATE "movies" SET "published" = true WHERE "video_url" IS NOT NULL;
