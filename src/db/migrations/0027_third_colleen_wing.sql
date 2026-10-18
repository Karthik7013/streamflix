CREATE TABLE "movie_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role_type" varchar(20) NOT NULL,
	"department" varchar(50),
	"job" varchar(100),
	"character" varchar(255),
	"credit_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"tmdb_id" integer,
	"profile_url" text,
	"biography" text,
	"birthday" date,
	"deathday" date,
	"gender" integer,
	"known_for_department" varchar(50),
	"popularity" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "people_slug_unique" UNIQUE("slug"),
	CONSTRAINT "people_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_movie_credits_movie_id" ON "movie_credits" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "idx_movie_credits_person_id" ON "movie_credits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "idx_movie_credits_movie_role_order" ON "movie_credits" USING btree ("movie_id","role_type","credit_order");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_credits_unique" ON "movie_credits" USING btree ("movie_id","person_id","role_type");--> statement-breakpoint
CREATE INDEX "idx_people_name_trgm" ON "people" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_people_slug_trgm" ON "people" USING gin ("slug" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_people_tmdb_id" ON "people" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_people_created_at" ON "people" USING btree ("created_at" DESC NULLS LAST);