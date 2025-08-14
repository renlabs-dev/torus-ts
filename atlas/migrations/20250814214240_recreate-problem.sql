-- Create accumulatedStreamAmounts table
CREATE TABLE IF NOT EXISTS "accumulated_stream_amounts" (
    "grantor_account_id" VARCHAR(256) NOT NULL,
    "stream_id" VARCHAR(66) NOT NULL,
    "permission_id" VARCHAR(66) NOT NULL,
    "accumulated_amount" NUMERIC(65, 12) NOT NULL DEFAULT '0',
    "last_updated" TIMESTAMPTZ DEFAULT NOW(),
    "last_executed_block" INTEGER,
    "at_block" INTEGER NOT NULL,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Primary key
    PRIMARY KEY ("grantor_account_id", "stream_id", "permission_id", "execution_count"),
    
    -- Foreign key
    FOREIGN KEY ("permission_id") REFERENCES "permissions" ("permission_id") ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE ("grantor_account_id", "stream_id", "permission_id", "execution_count")
);