-- Verifier feedback table for per-verifier feedback on predictions
CREATE TABLE IF NOT EXISTS verifier_feedback (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  parsed_prediction_id UUID NOT NULL REFERENCES parsed_prediction(id) ON DELETE CASCADE,
  verifier_agent_id VARCHAR(256) NOT NULL,
  verifier_agent_signature TEXT NOT NULL,
  failure_cause failure_cause_enum NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(parsed_prediction_id, verifier_agent_id)
);

CREATE INDEX IF NOT EXISTS verifier_feedback_prediction_idx ON verifier_feedback(parsed_prediction_id);
CREATE INDEX IF NOT EXISTS verifier_feedback_agent_idx ON verifier_feedback(verifier_agent_id);
CREATE INDEX IF NOT EXISTS verifier_feedback_failure_cause_idx ON verifier_feedback(failure_cause);
