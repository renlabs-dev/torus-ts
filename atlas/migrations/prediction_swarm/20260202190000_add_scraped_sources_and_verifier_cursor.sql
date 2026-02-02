-- Create scraped_sources cache table
CREATE TABLE IF NOT EXISTS "public"."scraped_sources" (
  "normalized_url" character varying(2048) NOT NULL,
  "original_url" character varying(2048) NOT NULL,
  "success" boolean NOT NULL,
  "content" text NULL,
  "title" character varying(512) NULL,
  "description" text NULL,
  "error" text NULL,
  "status_code" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("normalized_url")
);

CREATE INDEX IF NOT EXISTS "scraped_sources_created_at_idx" ON "public"."scraped_sources" ("created_at");
CREATE INDEX IF NOT EXISTS "scraped_sources_success_idx" ON "public"."scraped_sources" ("success");

-- Create verifier_cursor_state table for tracking verifier progress
CREATE TABLE IF NOT EXISTS "public"."verifier_cursor_state" (
  "verifier_agent_id" character varying(256) NOT NULL,
  "last_cursor" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("verifier_agent_id")
);
