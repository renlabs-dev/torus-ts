-- Modify "claim_validation_feedback" table
ALTER TABLE "public"."claim_validation_feedback" DROP CONSTRAINT "claim_validation_feedback_claim_id_fkey", ALTER COLUMN "claim_id" SET DEFAULT uuidv7(), ADD CONSTRAINT "claim_validation_feedback_claim_id_verification_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."verification_claim" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
