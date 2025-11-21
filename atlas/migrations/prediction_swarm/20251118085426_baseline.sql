-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
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
-- Create enum type "application_status"
CREATE TYPE "public"."application_status" AS ENUM ('Open', 'Accepted', 'Rejected', 'Expired');
-- Create enum type "purchase_type_enum"
CREATE TYPE "public"."purchase_type_enum" AS ENUM ('metadata', 'scraping');
-- Create "prediction_purchases" table
CREATE TABLE "public"."prediction_purchases" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_key" character varying(256) NOT NULL,
  "username" character varying(15) NOT NULL,
  "purchase_type" "public"."purchase_type_enum" NOT NULL,
  "credits_spent" numeric(39) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "prediction_purchases_type_idx" to table: "prediction_purchases"
CREATE INDEX "prediction_purchases_type_idx" ON "public"."prediction_purchases" ("purchase_type");
-- Create index "prediction_purchases_user_key_idx" to table: "prediction_purchases"
CREATE INDEX "prediction_purchases_user_key_idx" ON "public"."prediction_purchases" ("user_key");
-- Create index "prediction_purchases_username_idx" to table: "prediction_purchases"
CREATE INDEX "prediction_purchases_username_idx" ON "public"."prediction_purchases" ("username");
-- Create enum type "emission_allocation_type"
CREATE TYPE "public"."emission_allocation_type" AS ENUM ('streams', 'fixed_amount');
-- Create enum type "emission_distribution_type"
CREATE TYPE "public"."emission_distribution_type" AS ENUM ('manual', 'automatic', 'at_block', 'interval');
-- Create enum type "governance_item_type"
CREATE TYPE "public"."governance_item_type" AS ENUM ('PROPOSAL', 'AGENT_APPLICATION');
-- Create enum type "permission_duration_type"
CREATE TYPE "public"."permission_duration_type" AS ENUM ('until_block', 'indefinite');
-- Create enum type "permission_enforcement_type"
CREATE TYPE "public"."permission_enforcement_type" AS ENUM ('none', 'controlled_by');
-- Create enum type "permission_revocation_type"
CREATE TYPE "public"."permission_revocation_type" AS ENUM ('irrevocable', 'revocable_by_grantor', 'revocable_by_delegator', 'revocable_by_arbiters', 'revocable_after');
-- Create enum type "reaction_type"
CREATE TYPE "public"."reaction_type" AS ENUM ('LIKE', 'DISLIKE');
-- Create enum type "report_reason"
CREATE TYPE "public"."report_reason" AS ENUM ('SPAM', 'VIOLENCE', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT');
-- Create enum type "failure_cause_enum"
CREATE TYPE "public"."failure_cause_enum" AS ENUM ('NEGATION', 'SARCASM', 'CONDITIONAL', 'QUOTING_OTHERS', 'HEAVY_HEDGING', 'FUTURE_TIMEFRAME', 'MISSING_TIMEFRAME', 'BROKEN_EXTRACTION', 'VAGUE_GOAL', 'PRESENT_STATE', 'OTHER', 'EVENT_TRIGGER', 'EMPTY_SLICES', 'MISSING_TWEET', 'NEGATIVE_INDICES', 'INVALID_RANGE', 'SLICE_TOO_SHORT', 'OUT_OF_BOUNDS');
-- Create "proposal" table
CREATE TABLE "public"."proposal" (
  "id" serial NOT NULL,
  "expiration_block" integer NOT NULL,
  "status" "public"."application_status" NOT NULL,
  "proposer_key" character varying(256) NOT NULL,
  "creation_block" integer NOT NULL,
  "metadata_uri" text NOT NULL,
  "proposal_cost" numeric NOT NULL,
  "notified" boolean NOT NULL DEFAULT false,
  "proposal_id" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "proposal_proposal_id_unique" UNIQUE ("proposal_id")
);
-- Create "twitter_scraping_jobs" table
CREATE TABLE "public"."twitter_scraping_jobs" (
  "user_id" bigint NULL,
  "query" character varying(128) NULL,
  "conversation_id" bigint NULL,
  "original_reply_id" bigint NULL,
  "next_reply_id" bigint NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "twitter_scraping_jobs_original_reply_id_idx" UNIQUE ("conversation_id", "original_reply_id"),
  CONSTRAINT "twitter_scraping_jobs_user_id_idx" UNIQUE ("user_id")
);
-- Create index "twitter_scraping_jobs_conversation_id_idx" to table: "twitter_scraping_jobs"
CREATE INDEX "twitter_scraping_jobs_conversation_id_idx" ON "public"."twitter_scraping_jobs" ("conversation_id");
-- Create "twitter_user_suggestions" table
CREATE TABLE "public"."twitter_user_suggestions" (
  "username" character varying(15) NOT NULL,
  "wallet" character varying(256) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "twitter_user_suggestions_username_wallet_pk" PRIMARY KEY ("username", "wallet")
);
-- Create "agent_demand_signal" table
CREATE TABLE "public"."agent_demand_signal" (
  "id" serial NOT NULL,
  "agent_key" character varying(256) NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "proposed_allocation" integer NOT NULL,
  "fulfilled" boolean NOT NULL DEFAULT false,
  "discord" text NULL,
  "github" text NULL,
  "telegram" text NULL,
  "twitter" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "percent_check" CHECK ((proposed_allocation >= 0) AND (proposed_allocation <= 100))
);
-- Create "twitter_users" table
CREATE TABLE "public"."twitter_users" (
  "id" bigint NOT NULL,
  "username" character varying(15) NULL,
  "screen_name" character varying(50) NULL,
  "description" text NULL,
  "avatar_url" character varying(280) NULL,
  "is_verified" boolean NULL,
  "verified_type" character varying(32) NULL,
  "is_automated" boolean NULL,
  "automated_by" character varying(15) NULL,
  "unavailable" boolean NULL,
  "unavailable_reason" character varying(280) NULL,
  "user_created_at" timestamptz NULL,
  "tweet_count" integer NULL,
  "follower_count" integer NULL,
  "following_count" integer NULL,
  "oldest_tracked_tweet" bigint NULL,
  "newest_tracked_tweet" bigint NULL,
  "tracked" boolean NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_twitter_users_tracked_lower_username" to table: "twitter_users"
CREATE INDEX "idx_twitter_users_tracked_lower_username" ON "public"."twitter_users" ((lower((username)::text))) WHERE (tracked = true);
-- Create index "twitter_users_id_idx" to table: "twitter_users"
CREATE INDEX "twitter_users_id_idx" ON "public"."twitter_users" ("id");
-- Create "ask_torus_daily_usage" table
CREATE TABLE "public"."ask_torus_daily_usage" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "usage_date" date NOT NULL,
  "usage_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "usage_count_positive" CHECK (usage_count >= 0)
);
-- Create index "ask_torus_usage_date_idx" to table: "ask_torus_daily_usage"
CREATE INDEX "ask_torus_usage_date_idx" ON "public"."ask_torus_daily_usage" ("usage_date");
-- Create index "ask_torus_user_key_idx" to table: "ask_torus_daily_usage"
CREATE INDEX "ask_torus_user_key_idx" ON "public"."ask_torus_daily_usage" ("user_key");
-- Create enum type "agent_application_vote_type"
CREATE TYPE "public"."agent_application_vote_type" AS ENUM ('ACCEPT', 'REFUSE', 'REMOVE');
-- Create "user_credits" table
CREATE TABLE "public"."user_credits" (
  "user_key" character varying(256) NOT NULL,
  "balance" numeric(39) NOT NULL DEFAULT 0,
  "total_purchased" numeric(39) NOT NULL DEFAULT 0,
  "total_spent" numeric(39) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("user_key")
);
-- Create enum type "candidacy_status"
CREATE TYPE "public"."candidacy_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED');
-- Create "cadre_vote_history" table
CREATE TABLE "public"."cadre_vote_history" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "applicant_key" character varying(256) NOT NULL,
  "vote" "public"."agent_application_vote_type" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "user_discord_info" table
CREATE TABLE "public"."user_discord_info" (
  "id" serial NOT NULL,
  "discord_id" character varying(20) NOT NULL,
  "user_name" text NOT NULL,
  "avatar_url" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_discord_info_discord_id_unique" UNIQUE ("discord_id"),
  CONSTRAINT "discord_id_check" CHECK ((length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20))
);
-- Create "governance_notification" table
CREATE TABLE "public"."governance_notification" (
  "id" serial NOT NULL,
  "item_type" "public"."governance_item_type" NOT NULL,
  "item_id" integer NOT NULL,
  "notified_at" timestamptz NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "filter_cursor_state" table
CREATE TABLE "public"."filter_cursor_state" (
  "id" integer NOT NULL DEFAULT 1,
  "last_cursor" text NOT NULL DEFAULT '0_0',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "whitelist_application" table
CREATE TABLE "public"."whitelist_application" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "payer_key" character varying(256) NOT NULL,
  "data" text NOT NULL,
  "cost" numeric NOT NULL,
  "expires_at" integer NOT NULL,
  "status" "public"."application_status" NOT NULL,
  "notified" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "whitelist_application_user_key_unique" UNIQUE ("user_key")
);
-- Create "constraint" table
CREATE TABLE "public"."constraint" (
  "id" serial NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "credit_purchases" table
CREATE TABLE "public"."credit_purchases" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_key" character varying(256) NOT NULL,
  "tx_hash" character varying(66) NOT NULL,
  "torus_amount" numeric(39) NULL,
  "credits_granted" numeric(39) NULL,
  "block_number" bigint NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "credit_purchases_tx_hash_unique" UNIQUE ("tx_hash")
);
-- Create "permissions" table
CREATE TABLE "public"."permissions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "permission_id" character varying(66) NOT NULL,
  "grantor_account_id" character varying(256) NOT NULL,
  "grantee_account_id" character varying(256) NULL,
  "duration_type" "public"."permission_duration_type" NOT NULL,
  "duration_block_number" bigint NULL,
  "revocation_type" "public"."permission_revocation_type" NOT NULL,
  "revocation_block_number" bigint NULL,
  "revocation_required_votes" bigint NULL,
  "enforcement_type" "public"."permission_enforcement_type" NOT NULL DEFAULT 'none',
  "enforcement_required_votes" bigint NULL,
  "last_execution_block" bigint NULL,
  "execution_count" integer NOT NULL DEFAULT 0,
  "created_at_block" bigint NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "permissions_permission_id_unique" UNIQUE ("permission_id"),
  CONSTRAINT "valid_arbiters" CHECK (((revocation_type = 'revocable_by_arbiters'::public.permission_revocation_type) AND (revocation_required_votes IS NOT NULL)) OR ((revocation_type <> 'revocable_by_arbiters'::public.permission_revocation_type) AND (revocation_required_votes IS NULL))),
  CONSTRAINT "valid_duration" CHECK (((duration_type = 'until_block'::public.permission_duration_type) AND (duration_block_number IS NOT NULL)) OR ((duration_type = 'indefinite'::public.permission_duration_type) AND (duration_block_number IS NULL))),
  CONSTRAINT "valid_enforcement" CHECK (((enforcement_type = 'controlled_by'::public.permission_enforcement_type) AND (enforcement_required_votes IS NOT NULL)) OR ((enforcement_type = 'none'::public.permission_enforcement_type) AND (enforcement_required_votes IS NULL))),
  CONSTRAINT "valid_revocation_after" CHECK (((revocation_type = 'revocable_after'::public.permission_revocation_type) AND (revocation_block_number IS NOT NULL)) OR ((revocation_type <> 'revocable_after'::public.permission_revocation_type) AND (revocation_block_number IS NULL)))
);
-- Create index "permissions_created_at_idx" to table: "permissions"
CREATE INDEX "permissions_created_at_idx" ON "public"."permissions" ("created_at_block");
-- Create index "permissions_duration_idx" to table: "permissions"
CREATE INDEX "permissions_duration_idx" ON "public"."permissions" ("duration_type", "duration_block_number");
-- Create index "permissions_grantee_idx" to table: "permissions"
CREATE INDEX "permissions_grantee_idx" ON "public"."permissions" ("grantee_account_id");
-- Create index "permissions_grantor_idx" to table: "permissions"
CREATE INDEX "permissions_grantor_idx" ON "public"."permissions" ("grantor_account_id");
-- Create index "permissions_substrate_id_idx" to table: "permissions"
CREATE INDEX "permissions_substrate_id_idx" ON "public"."permissions" ("permission_id");
-- Create "accumulated_stream_amounts" table
CREATE TABLE "public"."accumulated_stream_amounts" (
  "grantor_account_id" character varying(256) NOT NULL,
  "stream_id" character varying(66) NOT NULL,
  "permission_id" character varying(66) NOT NULL,
  "accumulated_amount" numeric(65,12) NOT NULL DEFAULT 0,
  "last_updated" timestamptz NOT NULL DEFAULT now(),
  "last_executed_block" integer NULL,
  "at_block" integer NOT NULL,
  "execution_count" integer NOT NULL DEFAULT 0,
  CONSTRAINT "accumulated_stream_amounts_grantor_account_id_stream_id_permiss" PRIMARY KEY ("grantor_account_id", "stream_id", "permission_id", "execution_count"),
  CONSTRAINT "accumulated_stream_amounts_permission_id_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "cadre" table
CREATE TABLE "public"."cadre" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "discord_id" character varying(20) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "cadre_discord_id_unique" UNIQUE ("discord_id"),
  CONSTRAINT "cadre_user_key_unique" UNIQUE ("user_key"),
  CONSTRAINT "discord_id_check" CHECK ((length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20))
);
-- Create "agent_application_vote" table
CREATE TABLE "public"."agent_application_vote" (
  "id" serial NOT NULL,
  "application_id" integer NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "vote" "public"."agent_application_vote_type" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "agent_application_vote_application_id_user_key_unique" UNIQUE ("application_id", "user_key"),
  CONSTRAINT "agent_application_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre" ("user_key") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "agent" table
CREATE TABLE "public"."agent" (
  "id" serial NOT NULL,
  "at_block" integer NOT NULL,
  "key" character varying(256) NOT NULL,
  "name" text NULL,
  "api_url" text NULL,
  "metadata_uri" text NULL,
  "weight_factor" integer NULL,
  "is_whitelisted" boolean NULL,
  "registration_block" integer NULL,
  "total_staked" bigint NULL,
  "total_stakers" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "agent_key_unique" UNIQUE ("key"),
  CONSTRAINT "percent_check" CHECK ((weight_factor >= 0) AND (weight_factor <= 100))
);
-- Create index "key_index" to table: "agent"
CREATE INDEX "key_index" ON "public"."agent" ("key");
-- Create "agent_report" table
CREATE TABLE "public"."agent_report" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "agent_key" character varying(256) NOT NULL,
  "reason" "public"."report_reason" NOT NULL,
  "content" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "agent_report_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "cadre_candidate" table
CREATE TABLE "public"."cadre_candidate" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "discord_id" character varying(20) NOT NULL,
  "candidacy_status" "public"."candidacy_status" NOT NULL DEFAULT 'PENDING',
  "content" text NOT NULL,
  "notified" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "cadre_candidate_discord_id_unique" UNIQUE ("discord_id"),
  CONSTRAINT "cadre_candidate_user_key_unique" UNIQUE ("user_key"),
  CONSTRAINT "discord_id_check" CHECK ((length((discord_id)::text) >= 17) AND (length((discord_id)::text) <= 20))
);
-- Create "cadre_vote" table
CREATE TABLE "public"."cadre_vote" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "applicant_key" character varying(256) NOT NULL,
  "vote" "public"."agent_application_vote_type" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "cadre_vote_applicant_key_cadre_candidate_user_key_fk" FOREIGN KEY ("applicant_key") REFERENCES "public"."cadre_candidate" ("user_key") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "cadre_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre" ("user_key") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "comment" table
CREATE TABLE "public"."comment" (
  "id" serial NOT NULL,
  "item_type" "public"."governance_item_type" NOT NULL,
  "item_id" integer NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "user_name" text NULL,
  "content" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "comment_item_type_item_id_user_key_index" to table: "comment"
CREATE INDEX "comment_item_type_item_id_user_key_index" ON "public"."comment" ("item_type", "item_id", "user_key");
-- Create "comment_interaction" table
CREATE TABLE "public"."comment_interaction" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "comment_id" integer NOT NULL,
  "reaction_type" "public"."reaction_type" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "comment_interaction_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "comment_interaction_user_key_comment_id_index" to table: "comment_interaction"
CREATE INDEX "comment_interaction_user_key_comment_id_index" ON "public"."comment_interaction" ("user_key", "comment_id");
-- Create "comment_report" table
CREATE TABLE "public"."comment_report" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "comment_id" integer NULL,
  "reason" "public"."report_reason" NOT NULL,
  "content" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "comment_report_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "computed_agent_weight" table
CREATE TABLE "public"."computed_agent_weight" (
  "id" serial NOT NULL,
  "at_block" integer NOT NULL,
  "agent_key" character varying(256) NOT NULL,
  "computed_weight" numeric NOT NULL,
  "perc_computed_weight" real NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "computed_agent_weight_agent_key_unique" UNIQUE ("agent_key"),
  CONSTRAINT "computed_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "emission_permissions" table
CREATE TABLE "public"."emission_permissions" (
  "permission_id" character varying(66) NOT NULL,
  "allocation_type" "public"."emission_allocation_type" NOT NULL,
  "fixed_amount" numeric(65,12) NULL,
  "distribution_type" "public"."emission_distribution_type" NOT NULL,
  "distribution_threshold" numeric(65,12) NULL,
  "distribution_target_block" bigint NULL,
  "distribution_interval_blocks" bigint NULL,
  "accumulating" boolean NOT NULL DEFAULT true,
  "weight_setter" character varying(256)[] NOT NULL,
  "recipient_manager" character varying(256)[] NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("permission_id"),
  CONSTRAINT "emission_permissions_permission_id_permissions_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "valid_at_block" CHECK (((distribution_type = 'at_block'::public.emission_distribution_type) AND (distribution_target_block IS NOT NULL)) OR ((distribution_type <> 'at_block'::public.emission_distribution_type) AND (distribution_target_block IS NULL))),
  CONSTRAINT "valid_automatic" CHECK (((distribution_type = 'automatic'::public.emission_distribution_type) AND (distribution_threshold IS NOT NULL)) OR ((distribution_type <> 'automatic'::public.emission_distribution_type) AND (distribution_threshold IS NULL))),
  CONSTRAINT "valid_fixed_amount" CHECK (((allocation_type = 'fixed_amount'::public.emission_allocation_type) AND (fixed_amount IS NOT NULL)) OR ((allocation_type = 'streams'::public.emission_allocation_type) AND (fixed_amount IS NULL))),
  CONSTRAINT "valid_interval" CHECK (((distribution_type = 'interval'::public.emission_distribution_type) AND (distribution_interval_blocks IS NOT NULL)) OR ((distribution_type <> 'interval'::public.emission_distribution_type) AND (distribution_interval_blocks IS NULL)))
);
-- Create index "emission_accumulating_idx" to table: "emission_permissions"
CREATE INDEX "emission_accumulating_idx" ON "public"."emission_permissions" ("accumulating");
-- Create index "emission_allocation_type_idx" to table: "emission_permissions"
CREATE INDEX "emission_allocation_type_idx" ON "public"."emission_permissions" ("allocation_type");
-- Create index "emission_distribution_type_idx" to table: "emission_permissions"
CREATE INDEX "emission_distribution_type_idx" ON "public"."emission_permissions" ("distribution_type");
-- Create "emission_distribution_targets" table
CREATE TABLE "public"."emission_distribution_targets" (
  "permission_id" character varying(66) NOT NULL,
  "stream_id" character varying(66) NULL,
  "target_account_id" character varying(256) NOT NULL,
  "weight" integer NOT NULL,
  "accumulated_tokens" numeric NOT NULL DEFAULT 0,
  "at_block" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "emission_distribution_targets_permission_id_emission_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."emission_permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "valid_weight" CHECK ((weight >= 0) AND (weight <= 65535))
);
-- Create "emission_stream_allocations" table
CREATE TABLE "public"."emission_stream_allocations" (
  "permission_id" character varying(66) NOT NULL,
  "stream_id" character varying(66) NOT NULL,
  "percentage" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "emission_stream_allocations_permission_id_stream_id_unique" UNIQUE ("permission_id", "stream_id"),
  CONSTRAINT "emission_stream_allocations_permission_id_emission_permissions_" FOREIGN KEY ("permission_id") REFERENCES "public"."emission_permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "valid_percentage" CHECK ((percentage >= 0) AND (percentage <= 100))
);
-- Create "namespace_permissions" table
CREATE TABLE "public"."namespace_permissions" (
  "permission_id" character varying(66) NOT NULL,
  "recipient" character varying(256) NOT NULL,
  "max_instances" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("permission_id"),
  CONSTRAINT "namespace_permissions_permission_id_permissions_permission_id_f" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "namespace_permission_paths" table
CREATE TABLE "public"."namespace_permission_paths" (
  "permission_id" character varying(66) NOT NULL,
  "namespace_path" text NOT NULL,
  CONSTRAINT "namespace_permission_paths_permission_id_namespace_permissions_" FOREIGN KEY ("permission_id") REFERENCES "public"."namespace_permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "prediction" table
CREATE TABLE "public"."prediction" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "prediction_created_at_idx" to table: "prediction"
CREATE INDEX "prediction_created_at_idx" ON "public"."prediction" ("created_at");
-- Create "prediction_topic" table
CREATE TABLE "public"."prediction_topic" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "parent_id" uuid NULL,
  "name" text NOT NULL,
  "context_schema" jsonb NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "prediction_topic_parent_id_prediction_topic_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."prediction_topic" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "prediction_topic_name_idx" to table: "prediction_topic"
CREATE INDEX "prediction_topic_name_idx" ON "public"."prediction_topic" ("name");
-- Create index "prediction_topic_parent_id_idx" to table: "prediction_topic"
CREATE INDEX "prediction_topic_parent_id_idx" ON "public"."prediction_topic" ("parent_id");
-- Create "parsed_prediction" table
CREATE TABLE "public"."parsed_prediction" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "goal" jsonb NOT NULL,
  "timeframe" jsonb NOT NULL,
  "topic_id" uuid NOT NULL DEFAULT uuidv7(),
  "prediction_quality" integer NOT NULL,
  "brief_rationale" text NOT NULL,
  "llm_confidence" numeric NOT NULL,
  "vagueness" numeric NULL,
  "context" jsonb NULL,
  "filter_agent_id" character varying(256) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "parsed_prediction_prediction_id_prediction_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "parsed_prediction_topic_id_prediction_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."prediction_topic" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "parsed_prediction_prediction_id_idx" to table: "parsed_prediction"
CREATE INDEX "parsed_prediction_prediction_id_idx" ON "public"."parsed_prediction" ("prediction_id");
-- Create index "parsed_prediction_quality_idx" to table: "parsed_prediction"
CREATE INDEX "parsed_prediction_quality_idx" ON "public"."parsed_prediction" ("prediction_quality");
-- Create index "parsed_prediction_topic_id_idx" to table: "parsed_prediction"
CREATE INDEX "parsed_prediction_topic_id_idx" ON "public"."parsed_prediction" ("topic_id");
-- Create "parsed_prediction_details" table
CREATE TABLE "public"."parsed_prediction_details" (
  "parsed_prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "prediction_context" text NULL,
  "timeframe_status" character varying(32) NULL,
  "timeframe_start_utc" timestamptz NULL,
  "timeframe_end_utc" timestamptz NULL,
  "timeframe_precision" character varying(32) NULL,
  "timeframe_reasoning" text NULL,
  "timeframe_assumptions" jsonb NULL,
  "timeframe_confidence" numeric NULL,
  "filter_validation_confidence" numeric NULL,
  "filter_validation_reasoning" text NULL,
  "verdict_confidence" numeric NULL,
  "verdict_sources" jsonb NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("parsed_prediction_id"),
  CONSTRAINT "parsed_prediction_details_parsed_prediction_id_parsed_predictio" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "parsed_prediction_details_timeframe_end_utc_idx" to table: "parsed_prediction_details"
CREATE INDEX "parsed_prediction_details_timeframe_end_utc_idx" ON "public"."parsed_prediction_details" ("timeframe_end_utc") WITH (fillfactor = 100);
-- Create index "parsed_prediction_details_timeframe_start_utc_idx" to table: "parsed_prediction_details"
CREATE INDEX "parsed_prediction_details_timeframe_start_utc_idx" ON "public"."parsed_prediction_details" ("timeframe_start_utc") WITH (fillfactor = 100);
-- Create index "parsed_prediction_details_timeframe_status_idx" to table: "parsed_prediction_details"
CREATE INDEX "parsed_prediction_details_timeframe_status_idx" ON "public"."parsed_prediction_details" ("timeframe_status") WITH (fillfactor = 100);
-- Create "parsed_prediction_feedback" table
CREATE TABLE "public"."parsed_prediction_feedback" (
  "parsed_prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "reason" text NOT NULL,
  "validation_step" character varying(64) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "failure_cause" "public"."failure_cause_enum" NULL,
  PRIMARY KEY ("parsed_prediction_id"),
  CONSTRAINT "parsed_prediction_feedback_parsed_prediction_id_parsed_predicti" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "parsed_prediction_feedback_failure_cause_idx" to table: "parsed_prediction_feedback"
CREATE INDEX "parsed_prediction_feedback_failure_cause_idx" ON "public"."parsed_prediction_feedback" ("failure_cause") WITH (fillfactor = 100);
-- Create index "parsed_prediction_feedback_future_timeframe_idx" to table: "parsed_prediction_feedback"
CREATE INDEX "parsed_prediction_feedback_future_timeframe_idx" ON "public"."parsed_prediction_feedback" ("parsed_prediction_id") WHERE (failure_cause <> 'FUTURE_TIMEFRAME'::public.failure_cause_enum);
-- Create index "parsed_prediction_feedback_parsed_prediction_id_idx" to table: "parsed_prediction_feedback"
CREATE INDEX "parsed_prediction_feedback_parsed_prediction_id_idx" ON "public"."parsed_prediction_feedback" ("parsed_prediction_id") WITH (fillfactor = 100);
-- Create index "parsed_prediction_feedback_validation_step_idx" to table: "parsed_prediction_feedback"
CREATE INDEX "parsed_prediction_feedback_validation_step_idx" ON "public"."parsed_prediction_feedback" ("validation_step") WITH (fillfactor = 100);
-- Create "penalize_agent_votes" table
CREATE TABLE "public"."penalize_agent_votes" (
  "id" serial NOT NULL,
  "agent_key" character varying(256) NOT NULL,
  "cadre_key" character varying(256) NOT NULL,
  "penalty_factor" integer NOT NULL,
  "content" text NOT NULL,
  "executed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "penalize_agent_votes_agent_key_cadre_key_unique" UNIQUE ("agent_key", "cadre_key"),
  CONSTRAINT "penalize_agent_votes_cadre_key_cadre_user_key_fk" FOREIGN KEY ("cadre_key") REFERENCES "public"."cadre" ("user_key") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "percent_check" CHECK ((penalty_factor >= 0) AND (penalty_factor <= 100))
);
-- Create "permission_enforcement_controllers" table
CREATE TABLE "public"."permission_enforcement_controllers" (
  "permission_id" character varying(66) NOT NULL,
  "account_id" character varying(256) NOT NULL,
  CONSTRAINT "permission_enforcement_controllers_permission_id_permissions_pe" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "permission_enforcement_tracking" table
CREATE TABLE "public"."permission_enforcement_tracking" (
  "permission_id" character varying(66) NOT NULL,
  "controller_account_id" character varying(256) NOT NULL,
  "vote_state" boolean NOT NULL,
  "voted_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "permission_enforcement_tracking_permission_id_permissions_permi" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "enforcement_tracking_permission_idx" to table: "permission_enforcement_tracking"
CREATE INDEX "enforcement_tracking_permission_idx" ON "public"."permission_enforcement_tracking" ("permission_id");
-- Create "permission_hierarchies" table
CREATE TABLE "public"."permission_hierarchies" (
  "child_permission_id" character varying(66) NOT NULL,
  "parent_permission_id" character varying(66) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "permission_hierarchies_child_permission_id_permissions_permissi" FOREIGN KEY ("child_permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "permission_hierarchies_parent_permission_id_permissions_permiss" FOREIGN KEY ("parent_permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "permission_revocation_arbiters" table
CREATE TABLE "public"."permission_revocation_arbiters" (
  "permission_id" character varying(66) NOT NULL,
  "account_id" character varying(256) NOT NULL,
  CONSTRAINT "permission_revocation_arbiters_permission_id_permissions_permis" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "permission_revocation_votes" table
CREATE TABLE "public"."permission_revocation_votes" (
  "permission_id" character varying(66) NOT NULL,
  "voter_account_id" character varying(256) NOT NULL,
  "voted_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "permission_revocation_votes_permission_id_permissions_permissio" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "revocation_votes_permission_idx" to table: "permission_revocation_votes"
CREATE INDEX "revocation_votes_permission_idx" ON "public"."permission_revocation_votes" ("permission_id");
-- Create "scraped_tweet" table
CREATE TABLE "public"."scraped_tweet" (
  "id" bigint NOT NULL,
  "text" character varying(25000) NOT NULL,
  "author_id" bigint NOT NULL,
  "date" timestamptz NOT NULL,
  "quoted_id" bigint NULL,
  "conversation_id" bigint NULL,
  "parent_tweet_id" bigint NULL,
  "prediction_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "scraped_tweet_prediction_id_prediction_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."prediction" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "scraped_tweet_author_id_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_author_id_idx" ON "public"."scraped_tweet" ("author_id") WITH (fillfactor = 100);
-- Create index "scraped_tweet_author_id_prediction_id_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_author_id_prediction_id_idx" ON "public"."scraped_tweet" ("prediction_id", "author_id");
-- Create index "scraped_tweet_conversation_id_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_conversation_id_idx" ON "public"."scraped_tweet" ("conversation_id");
-- Create index "scraped_tweet_date_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_date_idx" ON "public"."scraped_tweet" ("date");
-- Create index "scraped_tweet_prediction_id_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_prediction_id_idx" ON "public"."scraped_tweet" ("prediction_id") WITH (fillfactor = 100);
-- Create "user_agent_weight" table
CREATE TABLE "public"."user_agent_weight" (
  "id" serial NOT NULL,
  "user_key" character varying(256) NOT NULL,
  "agent_key" character varying(256) NOT NULL,
  "weight" real NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "verdict" table
CREATE TABLE "public"."verdict" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "parsed_prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "verdict" boolean NOT NULL,
  "context" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "verdict_parsed_prediction_id_parsed_prediction_id_fk" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "verdict_created_at_idx" to table: "verdict"
CREATE INDEX "verdict_created_at_idx" ON "public"."verdict" ("created_at") WITH (fillfactor = 100);
-- Create index "verdict_parsed_prediction_id_idx" to table: "verdict"
CREATE INDEX "verdict_parsed_prediction_id_idx" ON "public"."verdict" ("parsed_prediction_id") WITH (fillfactor = 100);
-- Create index "verdict_verdict_idx" to table: "verdict"
CREATE INDEX "verdict_verdict_idx" ON "public"."verdict" ("verdict") WITH (fillfactor = 100);
