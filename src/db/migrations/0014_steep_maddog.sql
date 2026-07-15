CREATE TABLE "shorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"mp4_url" text NOT NULL,
	"poster_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
