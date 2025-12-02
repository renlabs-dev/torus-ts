-- Create "reward_distributions" table
CREATE TABLE "public"."reward_distributions" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "distribution_time" timestamptz NOT NULL,
  "permission_id" character varying(66) NULL,
  "scores" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "reward_distributions_distribution_time_idx" to table: "reward_distributions"
CREATE INDEX "reward_distributions_distribution_time_idx" ON "public"."reward_distributions" ("distribution_time");
-- Create index "reward_distributions_permission_id_idx" to table: "reward_distributions"
CREATE INDEX "reward_distributions_permission_id_idx" ON "public"."reward_distributions" ("permission_id");
