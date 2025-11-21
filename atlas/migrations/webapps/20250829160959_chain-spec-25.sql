-- Modify "namespace_permissions" table
ALTER TABLE "public"."namespace_permissions" ADD COLUMN "max_instances" integer NOT NULL DEFAULT 0;
