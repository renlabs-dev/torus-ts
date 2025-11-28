-- Create "user_watches" table
CREATE TABLE "public"."user_watches" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "watcher_key" character varying(256) NOT NULL,
  "watched_user_id" bigint NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_watches_unique" UNIQUE ("watcher_key", "watched_user_id"),
  CONSTRAINT "user_watches_watched_user_id_twitter_users_id_fk" FOREIGN KEY ("watched_user_id") REFERENCES "public"."twitter_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "user_watches_watched_user_id_idx" to table: "user_watches"
CREATE INDEX "user_watches_watched_user_id_idx" ON "public"."user_watches" ("watched_user_id");
-- Create index "user_watches_watcher_key_idx" to table: "user_watches"
CREATE INDEX "user_watches_watcher_key_idx" ON "public"."user_watches" ("watcher_key");
