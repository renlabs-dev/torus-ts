-- Modify "enforcement_authority" table
ALTER TABLE "public"."enforcement_authority" ADD CONSTRAINT "enforcement_authority_permission_id_ss58_address_unique" UNIQUE ("permission_id", "ss58_address");
-- Modify "permission_details" table
ALTER TABLE "public"."permission_details" ALTER COLUMN "duration" DROP NOT NULL;
