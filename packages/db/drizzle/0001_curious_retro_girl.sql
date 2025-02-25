-- Fixed second migration that only applies changes to existing database objects

-- Add DEFAULT null to deleted_at columns in existing tables
ALTER TABLE "agent_application_vote" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "agent_report" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "agent" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "cadre_candidate" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "cadre" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "cadre_vote_history" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "cadre_vote" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "comment_interaction" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "comment_report" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "comment" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "computed_agent_weight" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "governance_notification" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "penalize_agent_votes" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "user_agent_weight" ALTER COLUMN "deleted_at" SET DEFAULT null;
ALTER TABLE "whitelist_application" ALTER COLUMN "deleted_at" SET DEFAULT null;

-- Check if the 'notified' column is missing in the cadre_candidate table and add it if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'cadre_candidate' AND column_name = 'notified'
    ) THEN
        ALTER TABLE "cadre_candidate" ADD COLUMN "notified" boolean DEFAULT false NOT NULL;
    END IF;
END
$$;

-- Note: The CHECK constraint syntax changes don't need to be applied as they're just
-- a different way of expressing the same constraints that already exist in the database.
