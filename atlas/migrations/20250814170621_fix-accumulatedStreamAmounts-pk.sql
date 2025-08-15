-- Rename a column from "last_updated_block" to "last_executed_block"
ALTER TABLE "public"."accumulated_stream_amounts" RENAME COLUMN "last_updated_block" TO "last_executed_block";
