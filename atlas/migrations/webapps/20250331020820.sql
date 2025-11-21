-- Modify "proposal" table
ALTER TABLE "public"."proposal" ALTER COLUMN "status" TYPE text USING "status"::text;
-- Modify "whitelist_application" table
ALTER TABLE "public"."whitelist_application" ALTER COLUMN "status" TYPE text USING "status"::text;
