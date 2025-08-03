-- Add value to enum type: "permission_revocation_type"
ALTER TYPE "public"."permission_revocation_type" ADD VALUE 'revocable_by_delegator' AFTER 'revocable_by_grantor';
-- Modify "emission_distribution_targets" table
ALTER TABLE "public"."emission_distribution_targets" DROP CONSTRAINT "emission_distribution_targets_permission_id_target_account_id_u", ADD COLUMN "stream_id" character varying(66) NOT NULL, ADD COLUMN "accumulated_tokens" numeric NOT NULL DEFAULT 0, ADD COLUMN "at_block" integer NOT NULL, ADD CONSTRAINT "emission_distribution_targets_permission_id_stream_id_target_ac" UNIQUE ("permission_id", "stream_id", "target_account_id");
