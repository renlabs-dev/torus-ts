-- Modify "twitter_users" table
ALTER TABLE "public"."twitter_users" ADD COLUMN "scraped_at" timestamptz NULL;
