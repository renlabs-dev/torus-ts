-- Drop schema named "atlas_schema_revisions"
DROP SCHEMA "atlas_schema_revisions" CASCADE;
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'OPEN' BEFORE 'Open';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'ACCEPTED' AFTER 'OPEN';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'REJECTED' AFTER 'ACCEPTED';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'EXPIRED' AFTER 'REJECTED';
-- Modify "cadre_candidate" table
ALTER TABLE "public"."cadre_candidate" ALTER COLUMN "notified" DROP NOT NULL;
-- Drop "permission_details" table
DROP TABLE "public"."permission_details";
-- Drop "enforcement_authority" table
DROP TABLE "public"."enforcement_authority";
-- Drop "permission" table
DROP TABLE "public"."permission";
-- Drop "permission_emission_scope" table
DROP TABLE "public"."permission_emission_scope";
-- Drop enum type "distribution_type"
DROP TYPE "public"."distribution_type";
-- Drop enum type "permission_scope_type"
DROP TYPE "public"."permission_scope_type";
-- Drop "agent_demand_signal" table
DROP TABLE "public"."agent_demand_signal";
-- Drop "constraint" table
DROP TABLE "public"."constraint";
-- Drop "emission_streams_details" table
DROP TABLE "public"."emission_streams_details";
-- Drop "emission_streams" table
DROP TABLE "public"."emission_streams";
