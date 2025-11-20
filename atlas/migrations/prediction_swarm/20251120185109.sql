-- Add value to enum type: "failure_cause_enum"
ALTER TYPE "public"."failure_cause_enum" ADD VALUE 'SELF_ANNOUNCEMENT' AFTER 'PRESENT_STATE';
-- Add value to enum type: "failure_cause_enum"
ALTER TYPE "public"."failure_cause_enum" ADD VALUE 'PERSONAL_ACTION' AFTER 'SELF_ANNOUNCEMENT';
