-- Modify "parsed_prediction" table
ALTER TABLE "public"."parsed_prediction" ADD COLUMN "agent_alleged_timestamp" timestamptz NULL;
