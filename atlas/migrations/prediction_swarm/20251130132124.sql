-- Create "user_stars" table
CREATE TABLE "public"."user_stars" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_key" character varying(256) NOT NULL,
  "tweet_id" bigint NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_stars_unique" UNIQUE ("user_key", "tweet_id"),
  CONSTRAINT "user_stars_tweet_id_scraped_tweet_id_fk" FOREIGN KEY ("tweet_id") REFERENCES "public"."scraped_tweet" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "user_stars_tweet_id_idx" to table: "user_stars"
CREATE INDEX "user_stars_tweet_id_idx" ON "public"."user_stars" ("tweet_id");
-- Create index "user_stars_user_key_idx" to table: "user_stars"
CREATE INDEX "user_stars_user_key_idx" ON "public"."user_stars" ("user_key");
