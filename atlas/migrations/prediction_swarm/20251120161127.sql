-- Create enum type "report_type"
CREATE TYPE "public"."report_type" AS ENUM ('INACCURACY', 'FEEDBACK', 'OTHER');
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_details_timeframe_end_utc_idx"
ALTER INDEX "public"."parsed_prediction_details_timeframe_end_utc_idx" RESET (fillfactor);
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_details_timeframe_start_utc_idx"
ALTER INDEX "public"."parsed_prediction_details_timeframe_start_utc_idx" RESET (fillfactor);
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_details_timeframe_status_idx"
ALTER INDEX "public"."parsed_prediction_details_timeframe_status_idx" RESET (fillfactor);
-- Drop index "verdict_parsed_prediction_id_idx" from table: "verdict"
DROP INDEX "public"."verdict_parsed_prediction_id_idx";
-- Reset "fillfactor" storage parameter on index: "verdict_created_at_idx"
ALTER INDEX "public"."verdict_created_at_idx" RESET (fillfactor);
-- Reset "fillfactor" storage parameter on index: "verdict_verdict_idx"
ALTER INDEX "public"."verdict_verdict_idx" RESET (fillfactor);
-- Create index "verdict_parsed_prediction_id_idx" to table: "verdict"
CREATE INDEX "verdict_parsed_prediction_id_idx" ON "public"."verdict" USING hash ("parsed_prediction_id");
-- Drop index "idx_twitter_users_tracked_lower_username" from table: "twitter_users"
DROP INDEX "public"."idx_twitter_users_tracked_lower_username";
-- Drop index "twitter_users_id_idx" from table: "twitter_users"
DROP INDEX "public"."twitter_users_id_idx";
-- Create index "twitter_users_id_idx" to table: "twitter_users"
CREATE INDEX "twitter_users_id_idx" ON "public"."twitter_users" USING hash ("id");
-- Create index "twitter_users_tracked_idx" to table: "twitter_users"
CREATE INDEX "twitter_users_tracked_idx" ON "public"."twitter_users" USING hash ("tracked");
-- Create index "twitter_users_username_idx" to table: "twitter_users"
CREATE INDEX "twitter_users_username_idx" ON "public"."twitter_users" ((lower((username)::text)));
-- Drop index "twitter_scraping_jobs_conversation_id_idx" from table: "twitter_scraping_jobs"
DROP INDEX "public"."twitter_scraping_jobs_conversation_id_idx";
-- Create index "twitter_scraping_jobs_conversation_id_idx" to table: "twitter_scraping_jobs"
CREATE INDEX "twitter_scraping_jobs_conversation_id_idx" ON "public"."twitter_scraping_jobs" USING hash ("conversation_id");
-- Drop index "scraped_tweet_author_id_idx" from table: "scraped_tweet"
DROP INDEX "public"."scraped_tweet_author_id_idx";
-- Reset "fillfactor" storage parameter on index: "scraped_tweet_prediction_id_idx"
ALTER INDEX "public"."scraped_tweet_prediction_id_idx" RESET (fillfactor);
-- Create index "scraped_tweet_author_id_idx" to table: "scraped_tweet"
CREATE INDEX "scraped_tweet_author_id_idx" ON "public"."scraped_tweet" USING hash ("author_id");
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_feedback_failure_cause_idx"
ALTER INDEX "public"."parsed_prediction_feedback_failure_cause_idx" RESET (fillfactor);
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_feedback_parsed_prediction_id_idx"
ALTER INDEX "public"."parsed_prediction_feedback_parsed_prediction_id_idx" RESET (fillfactor);
-- Reset "fillfactor" storage parameter on index: "parsed_prediction_feedback_validation_step_idx"
ALTER INDEX "public"."parsed_prediction_feedback_validation_step_idx" RESET (fillfactor);
-- Create index "credit_purchases_user_key_idx" to table: "credit_purchases"
CREATE INDEX "credit_purchases_user_key_idx" ON "public"."credit_purchases" ("user_key");
-- Drop index "parsed_prediction_prediction_id_idx" from table: "parsed_prediction"
DROP INDEX "public"."parsed_prediction_prediction_id_idx";
-- Rename a column from "goal" to "target"
ALTER TABLE "public"."parsed_prediction" RENAME COLUMN "goal" TO "target";
-- Create index "parsed_prediction_prediction_id_idx" to table: "parsed_prediction"
CREATE INDEX "parsed_prediction_prediction_id_idx" ON "public"."parsed_prediction" USING hash ("prediction_id");
-- Create "prediction_report" table
CREATE TABLE "public"."prediction_report" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_key" character varying(256) NOT NULL,
  "parsed_prediction_id" uuid NULL DEFAULT uuidv7(),
  "report_type" "public"."report_type" NOT NULL,
  "content" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "prediction_report_parsed_prediction_id_parsed_prediction_id_fk" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "prediction_report_parsed_prediction_id_idx" to table: "prediction_report"
CREATE INDEX "prediction_report_parsed_prediction_id_idx" ON "public"."prediction_report" ("parsed_prediction_id");
-- Create index "prediction_report_report_type_idx" to table: "prediction_report"
CREATE INDEX "prediction_report_report_type_idx" ON "public"."prediction_report" ("report_type");
-- Create index "prediction_report_user_key_idx" to table: "prediction_report"
CREATE INDEX "prediction_report_user_key_idx" ON "public"."prediction_report" ("user_key");
-- Drop "whitelist_application" table
DROP TABLE "public"."whitelist_application";
-- Drop "agent_demand_signal" table
DROP TABLE "public"."agent_demand_signal";
-- Drop "prediction_purchases" table
DROP TABLE "public"."prediction_purchases";
-- Drop enum type "purchase_type_enum"
DROP TYPE "public"."purchase_type_enum";
-- Drop "stream_delegation" view
DROP VIEW IF EXISTS "public"."stream_delegation";
-- Drop "emission_distribution_targets" table
DROP TABLE "public"."emission_distribution_targets";
-- Drop "emission_stream_allocations" table
DROP TABLE "public"."emission_stream_allocations";
-- Drop "emission_permissions" table
DROP TABLE "public"."emission_permissions";
-- Drop enum type "emission_allocation_type"
DROP TYPE "public"."emission_allocation_type";
-- Drop enum type "emission_distribution_type"
DROP TYPE "public"."emission_distribution_type";
-- Drop "governance_notification" table
DROP TABLE "public"."governance_notification";
-- Drop "comment_interaction" table
DROP TABLE "public"."comment_interaction" CASCADE;
-- Drop "comment_report" table
DROP TABLE "public"."comment_report";
-- Drop "comment" table
DROP TABLE "public"."comment";
-- Drop enum type "governance_item_type"
DROP TYPE "public"."governance_item_type";
-- Drop "namespace_permission_paths" table
DROP TABLE "public"."namespace_permission_paths";
-- Drop "namespace_permissions" table
DROP TABLE "public"."namespace_permissions";
-- Drop "accumulated_stream_amounts" table
DROP TABLE "public"."accumulated_stream_amounts";
-- Drop "permission_enforcement_controllers" table
DROP TABLE "public"."permission_enforcement_controllers";
-- Drop "permission_enforcement_tracking" table
DROP TABLE "public"."permission_enforcement_tracking";
-- Drop "permission_hierarchies" table
DROP TABLE "public"."permission_hierarchies";
-- Drop "permission_revocation_arbiters" table
DROP TABLE "public"."permission_revocation_arbiters";
-- Drop "permission_revocation_votes" table
DROP TABLE "public"."permission_revocation_votes";
-- Drop "permissions" table
DROP TABLE "public"."permissions";
-- Drop enum type "permission_duration_type"
DROP TYPE "public"."permission_duration_type";
-- Drop enum type "permission_enforcement_type"
DROP TYPE "public"."permission_enforcement_type";
-- Drop enum type "permission_revocation_type"
DROP TYPE "public"."permission_revocation_type";
-- Drop enum type "reaction_type"
DROP TYPE "public"."reaction_type";
-- Drop "agent_report" table
DROP TABLE "public"."agent_report";
-- Drop "cadre_vote_history" table
DROP TABLE "public"."cadre_vote_history";
-- Drop "agent_application_vote" table
DROP TABLE "public"."agent_application_vote";
-- Drop "cadre_vote" table
DROP TABLE "public"."cadre_vote";
-- Drop enum type "agent_application_vote_type"
DROP TYPE "public"."agent_application_vote_type";
-- Drop "cadre_candidate" table
DROP TABLE "public"."cadre_candidate";
-- Drop enum type "candidacy_status"
DROP TYPE "public"."candidacy_status";
-- Drop "worker_state" table
DROP TABLE "public"."worker_state";
-- Drop enum type "worker_name"
DROP TYPE "public"."worker_name";
-- Drop "proposal" table
DROP TABLE "public"."proposal";
-- Drop enum type "application_status"
DROP TYPE "public"."application_status";
-- Drop enum type "report_reason"
DROP TYPE "public"."report_reason";
-- Drop "ask_torus_daily_usage" table
DROP TABLE "public"."ask_torus_daily_usage";
-- Drop "user_discord_info" table
DROP TABLE "public"."user_discord_info";
-- Drop "constraint" table
DROP TABLE "public"."constraint";
-- Drop "computed_agent_weight" table
DROP TABLE "public"."computed_agent_weight";
-- Drop "user_agent_weight" table
DROP TABLE "public"."user_agent_weight";
-- Drop "agent" table
DROP TABLE "public"."agent";
-- Drop "penalize_agent_votes" table
DROP TABLE "public"."penalize_agent_votes";
-- Drop "cadre" table
DROP TABLE "public"."cadre";
