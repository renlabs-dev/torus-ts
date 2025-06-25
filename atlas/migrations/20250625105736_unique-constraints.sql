-- Modify "emission_distribution_targets" table
ALTER TABLE "public"."emission_distribution_targets" ADD CONSTRAINT "emission_distribution_targets_permission_id_target_account_id_u" UNIQUE ("permission_id", "target_account_id");
-- Modify "emission_stream_allocations" table
ALTER TABLE "public"."emission_stream_allocations" ADD CONSTRAINT "emission_stream_allocations_permission_id_stream_id_unique" UNIQUE ("permission_id", "stream_id");
-- Modify "namespace_permission_paths" table
ALTER TABLE "public"."namespace_permission_paths" ADD CONSTRAINT "namespace_permission_paths_permission_id_namespace_path_unique" UNIQUE ("permission_id", "namespace_path");
-- Modify "permission_enforcement_controllers" table
ALTER TABLE "public"."permission_enforcement_controllers" ADD CONSTRAINT "permission_enforcement_controllers_permission_id_account_id_uni" UNIQUE ("permission_id", "account_id");
-- Modify "permission_hierarchies" table
ALTER TABLE "public"."permission_hierarchies" ADD CONSTRAINT "permission_hierarchies_child_permission_id_parent_permission_id" UNIQUE ("child_permission_id", "parent_permission_id");
-- Modify "permission_revocation_arbiters" table
ALTER TABLE "public"."permission_revocation_arbiters" ADD CONSTRAINT "permission_revocation_arbiters_permission_id_account_id_unique" UNIQUE ("permission_id", "account_id");
