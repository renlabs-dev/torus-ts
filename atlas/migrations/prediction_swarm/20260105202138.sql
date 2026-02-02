-- Create "verification_claim" table
CREATE TABLE "public"."verification_claim" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "parsed_prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "verifier_agent_id" character varying(256) NOT NULL,
  "verifier_agent_signature" text NOT NULL,
  "claim_outcome" boolean NOT NULL,
  "confidence" numeric NOT NULL,
  "reasoning" text NOT NULL,
  "sources" jsonb NULL,
  "timeframe_start_utc" timestamptz NULL,
  "timeframe_end_utc" timestamptz NULL,
  "timeframe_precision" character varying(32) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "verification_claim_unique_verifier" UNIQUE ("parsed_prediction_id", "verifier_agent_id"),
  CONSTRAINT "verification_claim_parsed_prediction_id_parsed_prediction_id_fk" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "verification_claim_created_at_idx" to table: "verification_claim"
CREATE INDEX "verification_claim_created_at_idx" ON "public"."verification_claim" ("created_at");
-- Create index "verification_claim_parsed_prediction_id_idx" to table: "verification_claim"
CREATE INDEX "verification_claim_parsed_prediction_id_idx" ON "public"."verification_claim" ("parsed_prediction_id");
-- Create index "verification_claim_verifier_agent_id_idx" to table: "verification_claim"
CREATE INDEX "verification_claim_verifier_agent_id_idx" ON "public"."verification_claim" ("verifier_agent_id");
-- Modify "verdict" table
ALTER TABLE "public"."verdict" ADD COLUMN "accepted_claim_id" uuid NULL DEFAULT uuidv7(), ADD CONSTRAINT "verdict_accepted_claim_id_verification_claim_id_fk" FOREIGN KEY ("accepted_claim_id") REFERENCES "public"."verification_claim" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Create "verifier_feedback" table
CREATE TABLE "public"."verifier_feedback" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "parsed_prediction_id" uuid NOT NULL DEFAULT uuidv7(),
  "verifier_agent_id" character varying(256) NOT NULL,
  "verifier_agent_signature" text NOT NULL,
  "failure_cause" "public"."failure_cause_enum" NOT NULL,
  "reason" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "verifier_feedback_unique" UNIQUE ("parsed_prediction_id", "verifier_agent_id"),
  CONSTRAINT "verifier_feedback_parsed_prediction_id_parsed_prediction_id_fk" FOREIGN KEY ("parsed_prediction_id") REFERENCES "public"."parsed_prediction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "verifier_feedback_agent_idx" to table: "verifier_feedback"
CREATE INDEX "verifier_feedback_agent_idx" ON "public"."verifier_feedback" ("verifier_agent_id");
-- Create index "verifier_feedback_failure_cause_idx" to table: "verifier_feedback"
CREATE INDEX "verifier_feedback_failure_cause_idx" ON "public"."verifier_feedback" ("failure_cause");
-- Create index "verifier_feedback_prediction_idx" to table: "verifier_feedback"
CREATE INDEX "verifier_feedback_prediction_idx" ON "public"."verifier_feedback" ("parsed_prediction_id");
-- Create "verifier_topic_registration" table
CREATE TABLE "public"."verifier_topic_registration" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "verifier_agent_id" character varying(256) NOT NULL,
  "topic_id" uuid NOT NULL DEFAULT uuidv7(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "verifier_topic_unique" UNIQUE ("verifier_agent_id", "topic_id"),
  CONSTRAINT "verifier_topic_registration_topic_id_prediction_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."prediction_topic" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "verifier_topic_agent_idx" to table: "verifier_topic_registration"
CREATE INDEX "verifier_topic_agent_idx" ON "public"."verifier_topic_registration" ("verifier_agent_id");
-- Create index "verifier_topic_topic_idx" to table: "verifier_topic_registration"
CREATE INDEX "verifier_topic_topic_idx" ON "public"."verifier_topic_registration" ("topic_id");
