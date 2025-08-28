-- Modify "emission_permissions" table
-- Add columns as nullable first
ALTER TABLE "public"."emission_permissions" 
ADD COLUMN "weight_setter" character varying(256)[],
ADD COLUMN "recipient_manager" character varying(256)[];

-- Populate with data from permissions.grantee_account_id
UPDATE "public"."emission_permissions" 
SET "weight_setter" = ARRAY[p.grantee_account_id],
    "recipient_manager" = ARRAY[p.grantee_account_id]
FROM "public"."permissions" p
WHERE "public"."emission_permissions".permission_id = p.permission_id
AND p.grantee_account_id IS NOT NULL;

-- Make them NOT NULL after populating
ALTER TABLE "public"."emission_permissions" 
ALTER COLUMN "weight_setter" SET NOT NULL,
ALTER COLUMN "recipient_manager" SET NOT NULL;
-- Modify "namespace_permissions" table
ALTER TABLE "public"."namespace_permissions" ADD COLUMN "recipient" character varying(256) NOT NULL;
-- Modify "permissions" table
ALTER TABLE "public"."permissions" ALTER COLUMN "grantee_account_id" DROP NOT NULL;
