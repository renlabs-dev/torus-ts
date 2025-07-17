-- Modify "agent_demand_signal" table
ALTER TABLE "public"."agent_demand_signal" ADD COLUMN "fulfilled" boolean NOT NULL DEFAULT false;
