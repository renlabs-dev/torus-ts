-- Open verification: verification claims and topic registration

CREATE TABLE IF NOT EXISTS verification_claim (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  parsed_prediction_id UUID NOT NULL REFERENCES parsed_prediction(id) ON DELETE CASCADE,
  verifier_agent_id VARCHAR(256) NOT NULL,
  verifier_agent_signature TEXT NOT NULL,
  claim_outcome BOOLEAN NOT NULL,
  confidence DECIMAL NOT NULL,
  reasoning TEXT NOT NULL,
  sources JSONB,
  timeframe_start_utc TIMESTAMP WITH TIME ZONE,
  timeframe_end_utc TIMESTAMP WITH TIME ZONE,
  timeframe_precision VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS verifier_topic_registration (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  verifier_agent_id VARCHAR(256) NOT NULL,
  topic_id UUID NOT NULL REFERENCES prediction_topic(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(verifier_agent_id, topic_id)
);

ALTER TABLE verdict ADD COLUMN IF NOT EXISTS accepted_claim_id UUID REFERENCES verification_claim(id);

CREATE INDEX IF NOT EXISTS verification_claim_parsed_prediction_id_idx ON verification_claim(parsed_prediction_id);
CREATE INDEX IF NOT EXISTS verification_claim_verifier_agent_id_idx ON verification_claim(verifier_agent_id);
CREATE INDEX IF NOT EXISTS verification_claim_created_at_idx ON verification_claim(created_at);
CREATE INDEX IF NOT EXISTS verifier_topic_agent_idx ON verifier_topic_registration(verifier_agent_id);
CREATE INDEX IF NOT EXISTS verifier_topic_topic_idx ON verifier_topic_registration(topic_id);
