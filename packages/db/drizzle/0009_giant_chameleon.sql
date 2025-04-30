CREATE TABLE "dao_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
ALTER TABLE "public"."proposal" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."whitelist_application" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."application_status";--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('Open', 'Accepted', 'Rejected', 'Expired');--> statement-breakpoint
ALTER TABLE "public"."proposal" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "public"."whitelist_application" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";