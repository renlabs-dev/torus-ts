-- Create accumulatedStreamAmounts table
CREATE TABLE IF NOT EXISTS "accumulated_stream_amounts" (
    "grantor_account_id" VARCHAR(256) NOT NULL,
    "stream_id" VARCHAR(66) NOT NULL,
    "permission_id" VARCHAR(66) NOT NULL,
    "accumulated_amount" NUMERIC(65, 12) NOT NULL DEFAULT '0',
    "last_updated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "last_executed_block" INTEGER,
    "at_block" INTEGER NOT NULL,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    
    -- Primary key with Drizzle's naming convention
    CONSTRAINT "accumulated_stream_amounts_grantor_account_id_stream_id_permiss" 
    PRIMARY KEY ("grantor_account_id", "stream_id", "permission_id", "execution_count"),
    
    -- Foreign key with Drizzle's naming convention
    CONSTRAINT "accumulated_stream_amounts_permission_id_permissions_permission" 
    FOREIGN KEY ("permission_id") REFERENCES "permissions" ("permission_id") ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE ("grantor_account_id", "stream_id", "permission_id", "execution_count")
);