CREATE TYPE "public"."agent_application_vote_type" AS ENUM('ACCEPT', 'REFUSE', 'REMOVE');--> statement-breakpoint
CREATE TYPE "public"."cadre_vote_type" AS ENUM('ACCEPT', 'REFUSE');--> statement-breakpoint
CREATE TYPE "public"."candidacy_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."governance_item_type" AS ENUM('PROPOSAL', 'AGENT_APPLICATION');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('LIKE', 'DISLIKE');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('SPAM', 'VIOLENCE', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT');--> statement-breakpoint
CREATE TABLE "agent_application_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"vote" "agent_application_vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "agent_application_vote_application_id_user_key_unique" UNIQUE("application_id","user_key")
);
--> statement-breakpoint
CREATE TABLE "agent_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"agent_key" varchar(256) NOT NULL,
	"reason" "report_reason" NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" serial PRIMARY KEY NOT NULL,
	"at_block" integer NOT NULL,
	"key" varchar(256) NOT NULL,
	"name" text,
	"api_url" text,
	"metadata_uri" text,
	"weight_factor" integer,
	"is_whitelisted" boolean,
	"registration_block" integer,
	"total_staked" bigint,
	"total_stakers" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "agent_key_unique" UNIQUE("key"),
	CONSTRAINT "percent_check" CHECK ("agent"."weight_factor" >= 0 and "agent"."weight_factor" <= 100)
);
--> statement-breakpoint
CREATE TABLE "cadre_candidate" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"discord_id" varchar(18) NOT NULL,
	"candidacyStatus" "candidacy_status" DEFAULT 'PENDING' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "cadre_candidate_user_key_unique" UNIQUE("user_key")
);
--> statement-breakpoint
CREATE TABLE "cadre" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"discord_id" varchar(18) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "cadre_user_key_unique" UNIQUE("user_key")
);
--> statement-breakpoint
CREATE TABLE "cadre_vote_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"applicant_key" varchar(256) NOT NULL,
	"vote" "agent_application_vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "cadre_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"applicant_key" varchar(256) NOT NULL,
	"vote" "agent_application_vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "cadre_vote_user_key_applicant_key_unique" UNIQUE("user_key","applicant_key")
);
--> statement-breakpoint
CREATE TABLE "comment_interaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"comment_id" integer NOT NULL,
	"reaction_type" "reaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "comment_interaction_user_key_comment_id_unique" UNIQUE("user_key","comment_id")
);
--> statement-breakpoint
CREATE TABLE "comment_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"comment_id" integer NOT NULL,
	"reason" "report_reason" NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" "governance_item_type" NOT NULL,
	"item_id" integer NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"user_name" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "computed_agent_weight" (
	"id" serial PRIMARY KEY NOT NULL,
	"at_block" integer NOT NULL,
	"agent_key" varchar(256) NOT NULL,
	"computed_weight" numeric NOT NULL,
	"perc_computed_weight" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "governance_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" "governance_item_type" NOT NULL,
	"item_id" integer NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "penalize_agent_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_key" varchar(256) NOT NULL,
	"cadre_key" varchar(256) NOT NULL,
	"penalty_factor" integer NOT NULL,
	"content" text NOT NULL,
	"executed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "penalize_agent_votes_agent_key_cadre_key_unique" UNIQUE("agent_key","cadre_key"),
	CONSTRAINT "percent_check" CHECK ("penalize_agent_votes"."penalty_factor" >= 0 and "penalize_agent_votes"."penalty_factor" <= 100)
);
--> statement-breakpoint
CREATE TABLE "user_agent_weight" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"agent_key" varchar(256) NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "user_agent_weight_user_key_agent_key_unique" UNIQUE("user_key","agent_key")
);
--> statement-breakpoint
ALTER TABLE "agent_application_vote" ADD CONSTRAINT "agent_application_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre"("user_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_report" ADD CONSTRAINT "agent_report_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadre_vote" ADD CONSTRAINT "cadre_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre"("user_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadre_vote" ADD CONSTRAINT "cadre_vote_applicant_key_cadre_candidate_user_key_fk" FOREIGN KEY ("applicant_key") REFERENCES "public"."cadre_candidate"("user_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_interaction" ADD CONSTRAINT "comment_interaction_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_report" ADD CONSTRAINT "comment_report_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "computed_agent_weight" ADD CONSTRAINT "computed_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalize_agent_votes" ADD CONSTRAINT "penalize_agent_votes_cadre_key_cadre_user_key_fk" FOREIGN KEY ("cadre_key") REFERENCES "public"."cadre"("user_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_weight" ADD CONSTRAINT "user_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "key_index" ON "agent" USING btree ("key");--> statement-breakpoint
CREATE INDEX "comment_interaction_user_key_comment_id_index" ON "comment_interaction" USING btree ("user_key","comment_id");--> statement-breakpoint
CREATE INDEX "comment_item_type_item_id_user_key_index" ON "comment" USING btree ("item_type","item_id","user_key");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."comment_digest" AS (select "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."user_name", "comment"."content", "comment"."created_at", sum(CASE WHEN "comment_interaction"."reaction_type" = 'LIKE' THEN 1 ELSE 0 END) as "likes", sum(CASE WHEN "comment_interaction"."reaction_type" = 'DISLIKE' THEN 1 ELSE 0 END) as "dislikes" from "comment" left join "comment_interaction" on "comment"."id" = "comment_interaction"."comment_id" where "comment"."deleted_at" is null group by "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."content", "comment"."created_at" order by "comment"."created_at" asc);