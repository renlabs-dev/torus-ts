CREATE TYPE "public"."application_status" AS ENUM('OPEN', 'ACCEPTED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" serial PRIMARY KEY NOT NULL,
	"expiration_block" integer NOT NULL,
	"status" "application_status" NOT NULL,
	"proposer_key" varchar(256) NOT NULL,
	"creation_block" integer NOT NULL,
	"metadata_uri" text NOT NULL,
	"proposal_cost" numeric NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "whitelist_application" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"payer_key" varchar(256) NOT NULL,
	"data" text NOT NULL,
	"cost" numeric NOT NULL,
	"expires_at" integer NOT NULL,
	"status" "application_status" NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "whitelist_application_user_key_unique" UNIQUE("user_key")
);
--> statement-breakpoint
ALTER TABLE "cadre_candidate" ADD COLUMN "notified" boolean DEFAULT false NOT NULL;