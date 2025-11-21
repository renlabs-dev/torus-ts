-- Create enum type "worker_name"
CREATE TYPE "public"."worker_name" AS ENUM ('agent-fetcher', 'dao-notifier', 'process-dao', 'weight-aggregator', 'transfer-watcher');
-- Create "worker_state" table
CREATE TABLE "public"."worker_state" (
  "id" serial NOT NULL,
  "worker_name" "public"."worker_name" NOT NULL,
  "last_processed_block" bigint NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "worker_state_worker_name_unique" UNIQUE ("worker_name")
);
-- Create index "worker_name_index" to table: "worker_state"
CREATE INDEX "worker_name_index" ON "public"."worker_state" ("worker_name");
