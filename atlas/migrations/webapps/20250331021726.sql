UPDATE "public"."proposal"
SET "status" = CASE 
    WHEN UPPER("status") = 'OPEN' THEN 'Open'
    WHEN UPPER("status") = 'ACCEPTED' THEN 'Accepted'
    WHEN UPPER("status") = 'REJECTED' THEN 'Rejected'
    WHEN UPPER("status") = 'EXPIRED' THEN 'Expired'
END
WHERE "status" IN ('OPEN', 'ACCEPTED', 'REJECTED', 'EXPIRED');

UPDATE "public"."whitelist_application"
SET "status" = CASE 
    WHEN UPPER("status") = 'OPEN' THEN 'Open'
    WHEN UPPER("status") = 'ACCEPTED' THEN 'Accepted'
    WHEN UPPER("status") = 'REJECTED' THEN 'Rejected'
    WHEN UPPER("status") = 'EXPIRED' THEN 'Expired'
END
WHERE "status" IN ('OPEN', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- Create enum type "application_status"
CREATE TYPE "public"."application_status" AS ENUM ('Open', 'Accepted', 'Rejected', 'Expired');

ALTER TABLE "public"."proposal" 
    ALTER COLUMN "status" TYPE "public"."application_status" 
    USING "status"::"public"."application_status";

ALTER TABLE "public"."whitelist_application" 
    ALTER COLUMN "status" TYPE "public"."application_status" 
    USING "status"::"public"."application_status";


-- Modify "proposal" table
ALTER TABLE "public"."proposal" ALTER COLUMN "status" TYPE "public"."application_status" USING "status"::"public"."application_status";
-- Modify "whitelist_application" table
ALTER TABLE "public"."whitelist_application" ALTER COLUMN "status" TYPE "public"."application_status" USING "status"::"public"."application_status";
