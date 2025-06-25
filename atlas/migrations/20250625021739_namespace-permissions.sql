-- Create enum type "emission_allocation_type"
CREATE TYPE "public"."emission_allocation_type" AS ENUM ('streams', 'fixed_amount');
-- Create enum type "emission_distribution_type"
CREATE TYPE "public"."emission_distribution_type" AS ENUM ('manual', 'automatic', 'at_block', 'interval');
-- Create enum type "permission_duration_type"
CREATE TYPE "public"."permission_duration_type" AS ENUM ('until_block', 'indefinite');
-- Create enum type "permission_enforcement_type"
CREATE TYPE "public"."permission_enforcement_type" AS ENUM ('none', 'controlled_by');
-- Create enum type "permission_revocation_type"
CREATE TYPE "public"."permission_revocation_type" AS ENUM ('irrevocable', 'revocable_by_grantor', 'revocable_by_arbiters', 'revocable_after');
-- Create "permissions" table
CREATE TABLE "public"."permissions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "permission_id" character varying(66) NOT NULL,
  "grantor_account_id" character varying(256) NOT NULL,
  "grantee_account_id" character varying(256) NOT NULL,
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
  CONSTRAINT "accumulated_stream_amounts_permission_id_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "accumulated_streams_grantor_stream_idx" to table: "accumulated_stream_amounts"
CREATE INDEX "accumulated_streams_grantor_stream_idx" ON "public"."accumulated_stream_amounts" ("grantor_account_id", "stream_id");
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
  "target_account_id" character varying(256) NOT NULL,
  "weight" integer NOT NULL,
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
  CONSTRAINT "emission_stream_allocations_permission_id_emission_permissions_" FOREIGN KEY ("permission_id") REFERENCES "public"."emission_permissions" ("permission_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "valid_percentage" CHECK ((percentage >= 0) AND (percentage <= 100))
);
-- Create "namespace_permissions" table
CREATE TABLE "public"."namespace_permissions" (
  "permission_id" character varying(66) NOT NULL,
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
-- Drop "enforcement_authority" table
DROP TABLE "public"."enforcement_authority";
-- Drop "permission_details" table
DROP TABLE "public"."permission_details";
-- Drop "permission" table
DROP TABLE "public"."permission";
-- Drop "permission_emission_scope" table
DROP TABLE "public"."permission_emission_scope";
-- Drop enum type "distribution_type"
DROP TYPE "public"."distribution_type";
-- Drop enum type "permission_scope_type"
DROP TYPE "public"."permission_scope_type";
-- Drop "emission_streams_details" table
DROP TABLE "public"."emission_streams_details";
-- Drop "emission_streams" table
DROP TABLE "public"."emission_streams";
