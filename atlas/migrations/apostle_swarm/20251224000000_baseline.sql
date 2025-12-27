-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";

-- Create extension for uuidv7
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create uuidv7 function if not exists
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);
  uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
  uuid_bytes = set_byte(uuid_bytes, 8, (b'10' || get_byte(uuid_bytes, 8)::bit(6))::bit(8)::int);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$ LANGUAGE plpgsql VOLATILE;

-- Create enum type "apostle_origin"
CREATE TYPE "public"."apostle_origin" AS ENUM ('COMMUNITY', 'APOSTLE_MANUAL');

-- Create enum type "approval_status"
CREATE TYPE "public"."approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create enum type "claim_status"
CREATE TYPE "public"."claim_status" AS ENUM ('UNCLAIMED', 'CLAIMED', 'FAILED', 'CONVERTED');

-- Create enum type "quality_tag"
CREATE TYPE "public"."quality_tag" AS ENUM ('UNRATED', 'HIGH_POTENTIAL', 'MID_POTENTIAL', 'LOW_POTENTIAL', 'BAD_PROSPECT');

-- Create enum type "conversion_event_type"
CREATE TYPE "public"."conversion_event_type" AS ENUM ('CONVERTED', 'FAILED');

-- Create enum type "conversion_source"
CREATE TYPE "public"."conversion_source" AS ENUM ('AUTO_FOLLOW_CHECK', 'MANUAL_MARK');

-- Create enum type "job_type"
CREATE TYPE "public"."job_type" AS ENUM ('SCRAPE_PROSPECT', 'EVALUATE_PROSPECT', 'GENERATE_STRATEGY', 'CHECK_CONVERSION');

-- Create enum type "job_status"
CREATE TYPE "public"."job_status" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'COMPLETED');

-- Create "apostles" table
CREATE TABLE "public"."apostles" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "wallet_address" character varying(256) NOT NULL,
  "x_handle" text NULL,
  "display_name" text NULL,
  "is_admin" boolean NOT NULL DEFAULT false,
  "weight" numeric NOT NULL DEFAULT '1',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "apostles_wallet_address_unique" UNIQUE ("wallet_address")
);

-- Create indexes for "apostles" table
CREATE INDEX "apostles_wallet_address_idx" ON "public"."apostles" ("wallet_address");
CREATE INDEX "apostles_is_admin_idx" ON "public"."apostles" ("is_admin");

-- Create "prospects" table
CREATE TABLE "public"."prospects" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "x_handle" character varying(256) NOT NULL,
  "display_name" text NULL,
  "avatar_url" text NULL,
  "origin" "public"."apostle_origin" NOT NULL,
  "proposer_wallet_address" character varying(256) NULL,
  "proposer_stake_snapshot" numeric NULL,
  "approval_status" "public"."approval_status" NOT NULL DEFAULT 'PENDING',
  "claim_status" "public"."claim_status" NOT NULL DEFAULT 'UNCLAIMED',
  "claimed_by_apostle_id" uuid NULL,
  "claimed_at" timestamptz NULL,
  "quality_tag" "public"."quality_tag" NOT NULL DEFAULT 'UNRATED',
  "resonance_score" numeric NULL,
  "last_conversion_check_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "prospects_x_handle_unique" UNIQUE ("x_handle"),
  CONSTRAINT "resonance_score_range" CHECK (resonance_score IS NULL OR (resonance_score >= 0 AND resonance_score <= 10)),
  CONSTRAINT "prospects_claimed_by_apostle_id_fkey" FOREIGN KEY ("claimed_by_apostle_id") REFERENCES "public"."apostles" ("id") ON DELETE SET NULL
);

-- Create indexes for "prospects" table
CREATE INDEX "prospects_x_handle_idx" ON "public"."prospects" ("x_handle");
CREATE INDEX "prospects_claim_status_idx" ON "public"."prospects" ("claim_status");
CREATE INDEX "prospects_approval_status_idx" ON "public"."prospects" ("approval_status");
CREATE INDEX "prospects_claimed_by_apostle_id_idx" ON "public"."prospects" ("claimed_by_apostle_id");
CREATE INDEX "prospects_quality_tag_idx" ON "public"."prospects" ("quality_tag");
CREATE INDEX "prospects_resonance_score_idx" ON "public"."prospects" ("resonance_score");

-- Create "conversion_logs" table
CREATE TABLE "public"."conversion_logs" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "prospect_id" uuid NOT NULL,
  "apostle_id" uuid NULL,
  "event_type" "public"."conversion_event_type" NOT NULL,
  "source" "public"."conversion_source" NOT NULL,
  "details" jsonb NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "conversion_logs_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects" ("id") ON DELETE CASCADE,
  CONSTRAINT "conversion_logs_apostle_id_fkey" FOREIGN KEY ("apostle_id") REFERENCES "public"."apostles" ("id") ON DELETE SET NULL
);

-- Create indexes for "conversion_logs" table
CREATE INDEX "conversion_logs_prospect_id_idx" ON "public"."conversion_logs" ("prospect_id");
CREATE INDEX "conversion_logs_apostle_id_idx" ON "public"."conversion_logs" ("apostle_id");
CREATE INDEX "conversion_logs_event_type_idx" ON "public"."conversion_logs" ("event_type");
CREATE INDEX "conversion_logs_created_at_idx" ON "public"."conversion_logs" ("created_at");

-- Create "memory_store" table
CREATE TABLE "public"."memory_store" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "prospect_id" uuid NOT NULL,
  "x_bio" text NULL,
  "x_tweets_raw" jsonb NULL,
  "evaluation_profile" jsonb NULL,
  "approach_strategy" jsonb NULL,
  "last_scraped_at" timestamptz NULL,
  "last_evaluated_at" timestamptz NULL,
  "last_strategy_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "memory_store_prospect_id_unique" UNIQUE ("prospect_id"),
  CONSTRAINT "memory_store_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects" ("id") ON DELETE CASCADE
);

-- Create indexes for "memory_store" table
CREATE INDEX "memory_store_prospect_id_idx" ON "public"."memory_store" ("prospect_id");
CREATE INDEX "memory_store_last_scraped_at_idx" ON "public"."memory_store" ("last_scraped_at");
CREATE INDEX "memory_store_last_evaluated_at_idx" ON "public"."memory_store" ("last_evaluated_at");

-- Create "jobs_queue" table
CREATE TABLE "public"."jobs_queue" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "job_type" "public"."job_type" NOT NULL,
  "payload" jsonb NOT NULL,
  "status" "public"."job_status" NOT NULL DEFAULT 'PENDING',
  "run_at" timestamptz NOT NULL DEFAULT now(),
  "last_error" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);

-- Create indexes for "jobs_queue" table
CREATE INDEX "jobs_queue_status_idx" ON "public"."jobs_queue" ("status");
CREATE INDEX "jobs_queue_job_type_idx" ON "public"."jobs_queue" ("job_type");
CREATE INDEX "jobs_queue_run_at_idx" ON "public"."jobs_queue" ("run_at");
CREATE INDEX "jobs_queue_status_run_at_idx" ON "public"."jobs_queue" ("status", "run_at");
