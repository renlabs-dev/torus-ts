-- Add unique constraint to verification_claim table
-- Ensures each verifier can only submit one claim per prediction
ALTER TABLE verification_claim
ADD CONSTRAINT verification_claim_unique_verifier
UNIQUE (parsed_prediction_id, verifier_agent_id);
