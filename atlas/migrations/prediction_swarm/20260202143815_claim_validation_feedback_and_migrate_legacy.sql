-- Migration: claim_validation_feedback table and legacy feedback migration
--
-- 1. Creates the claim_validation_result enum for judge feedback
-- 2. Creates the claim_validation_feedback table used by the judge
-- 3. Migrates legacy parsed_prediction_feedback to verifier_feedback

-- Step 1: Create enum for claim validation results
CREATE TYPE claim_validation_result AS ENUM (
  'rejected',         -- Trusted source contradicted the claim (verifier bug)
  'no_corroboration', -- Sources fetched but none supported the claim
  'no_sources',       -- Claim had no valid source URLs
  'fetch_failed'      -- All sources failed to fetch (temporary, retry later)
);

-- Step 2: Create claim_validation_feedback table
CREATE TABLE IF NOT EXISTS claim_validation_feedback (
  claim_id UUID PRIMARY KEY REFERENCES verification_claim(id) ON DELETE CASCADE,
  result claim_validation_result NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS claim_validation_feedback_result_idx
  ON claim_validation_feedback(result);

CREATE INDEX IF NOT EXISTS claim_validation_feedback_updated_at_idx
  ON claim_validation_feedback(updated_at);

CREATE INDEX IF NOT EXISTS claim_validation_feedback_active_idx
  ON claim_validation_feedback(claim_id)
  WHERE deleted_at IS NULL;

-- Step 3: Migrate legacy parsed_prediction_feedback to verifier_feedback
-- Attributes all legacy feedback to the trusted verifier for filter benchmark calculations
INSERT INTO verifier_feedback (
  id,
  parsed_prediction_id,
  verifier_agent_id,
  verifier_agent_signature,
  failure_cause,
  reason,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  uuidv7(),
  ppf.parsed_prediction_id,
  '5D5EMS8cLfCf98dpXsHQaw2XmE9rGiZ1x1i8jfcSdbc9Lbqy',
  'MIGRATED_FROM_LEGACY_JUDGE',
  ppf.failure_cause,
  ppf.reason,
  ppf.created_at,
  ppf.updated_at,
  ppf.deleted_at
FROM parsed_prediction_feedback ppf
WHERE ppf.failure_cause IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM verifier_feedback vf
    WHERE vf.parsed_prediction_id = ppf.parsed_prediction_id
      AND vf.verifier_agent_id = '5D5EMS8cLfCf98dpXsHQaw2XmE9rGiZ1x1i8jfcSdbc9Lbqy'
  );
