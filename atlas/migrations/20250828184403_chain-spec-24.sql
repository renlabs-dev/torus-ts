-- Modify "emission_permissions" table
ALTER TABLE "public"."emission_permissions" ADD COLUMN "weight_setter" character varying(256)[] NOT NULL, ADD COLUMN "recipient_manager" character varying(256)[] NOT NULL;
-- Modify "namespace_permissions" table
ALTER TABLE "public"."namespace_permissions" ADD COLUMN "recipient" character varying(256) NOT NULL;
-- Modify "permissions" table
ALTER TABLE "public"."permissions" ALTER COLUMN "grantee_account_id" DROP NOT NULL;
