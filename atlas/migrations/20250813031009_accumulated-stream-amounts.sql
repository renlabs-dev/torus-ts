-- Drop index "accumulated_streams_grantor_stream_idx" from table: "accumulated_stream_amounts"
DROP INDEX "public"."accumulated_streams_grantor_stream_idx";
-- Modify "accumulated_stream_amounts" table
ALTER TABLE "public"."accumulated_stream_amounts" ADD COLUMN "last_updated_block" integer NULL, ADD COLUMN "at_block" integer NOT NULL, ADD COLUMN "execution_count" integer NOT NULL DEFAULT 0;
