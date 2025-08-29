-- Modify "namespace_permissions" table
-- Step 1: Add the column as nullable first
ALTER TABLE "public"."namespace_permissions" ADD COLUMN "max_instances" integer;

-- Step 2: Populate the new column with values from the permissions table
-- The maxInstances field was previously stored in the permissions table, 
-- so we need to copy those values for existing namespace permissions
UPDATE "public"."namespace_permissions" 
SET "max_instances" = p."max_instances"
FROM "public"."permissions" p 
WHERE "namespace_permissions"."permission_id" = p."permission_id"
AND p."max_instances" IS NOT NULL;

-- Step 3: Set default value of 0 for any remaining NULL values
UPDATE "public"."namespace_permissions" 
SET "max_instances" = 0 
WHERE "max_instances" IS NULL;

-- Step 4: Make the column NOT NULL now that all rows have values
ALTER TABLE "public"."namespace_permissions" ALTER COLUMN "max_instances" SET NOT NULL;
