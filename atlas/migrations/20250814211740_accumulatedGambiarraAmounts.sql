-- Modify "accumulated_stream_amounts" table
ALTER TABLE "public"."accumulated_stream_amounts" ADD CONSTRAINT "accumulated_stream_amounts_grantor_account_id_stream_id_permiss" PRIMARY KEY ("grantor_account_id", "stream_id", "permission_id", "execution_count");
