-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'Open' BEFORE 'OPEN';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'Accepted' AFTER 'Open';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'Rejected' AFTER 'Accepted';
-- Add value to enum type: "application_status"
ALTER TYPE "public"."application_status" ADD VALUE 'Expired' AFTER 'Rejected';
