-- Create "ask_torus_daily_usage" table
CREATE TABLE "public"."ask_torus_daily_usage" ("id" serial NOT NULL, "user_key" character varying(256) NOT NULL, "usage_date" date NOT NULL, "usage_count" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, PRIMARY KEY ("id"), CONSTRAINT "ask_torus_daily_usage_user_key_usage_date_unique" UNIQUE ("user_key", "usage_date"), CONSTRAINT "usage_count_positive" CHECK (usage_count >= 0));
-- Create index "ask_torus_usage_date_idx" to table: "ask_torus_daily_usage"
CREATE INDEX "ask_torus_usage_date_idx" ON "public"."ask_torus_daily_usage" ("usage_date");
-- Create index "ask_torus_user_key_idx" to table: "ask_torus_daily_usage"
CREATE INDEX "ask_torus_user_key_idx" ON "public"."ask_torus_daily_usage" ("user_key");
