ALTER TABLE "public"."accumulated_stream_amounts" 
ADD PRIMARY KEY ("grantor_account_id", "stream_id", "permission_id", "execution_count");
