CREATE TYPE "public"."agent_application_vote_type" AS ENUM('ACCEPT', 'REFUSE', 'REMOVE');
CREATE TYPE "public"."cadre_vote_type" AS ENUM('ACCEPT', 'REFUSE');
CREATE TYPE "public"."governance_item_type" AS ENUM('PROPOSAL', 'AGENT_APPLICATION');
CREATE TYPE "public"."reaction_type" AS ENUM('LIKE', 'DISLIKE');
CREATE TYPE "public"."report_reason" AS ENUM('SPAM', 'VIOLENCE', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT');
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

CREATE TABLE "cadre_candidate" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"discord_id" varchar(18) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "cadre_candidate_user_key_unique" UNIQUE("user_key")
);

CREATE TABLE "cadre" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"discord_id" varchar(18) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "cadre_user_key_unique" UNIQUE("user_key")
);

CREATE TABLE "cadre_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"applicant_key" varchar(256) NOT NULL,
	"vote" "cadre_vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);

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

CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" "governance_item_type" NOT NULL,
	"item_id" integer NOT NULL,
	"user_key" varchar(256) NOT NULL,
	"user_name" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "comment_item_type_item_id_user_key_unique" UNIQUE("item_type","item_id","user_key")
);

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

CREATE TABLE "governance_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" "governance_item_type" NOT NULL,
	"item_id" integer NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null
);

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

ALTER TABLE "agent_application_vote" ADD CONSTRAINT "agent_application_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre"("user_key") ON DELETE no action ON UPDATE no action;
ALTER TABLE "agent_report" ADD CONSTRAINT "agent_report_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;
ALTER TABLE "cadre_vote" ADD CONSTRAINT "cadre_vote_user_key_cadre_user_key_fk" FOREIGN KEY ("user_key") REFERENCES "public"."cadre"("user_key") ON DELETE no action ON UPDATE no action;
ALTER TABLE "cadre_vote" ADD CONSTRAINT "cadre_vote_applicant_key_cadre_candidate_user_key_fk" FOREIGN KEY ("applicant_key") REFERENCES "public"."cadre_candidate"("user_key") ON DELETE no action ON UPDATE no action;
ALTER TABLE "comment_interaction" ADD CONSTRAINT "comment_interaction_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "comment_report" ADD CONSTRAINT "comment_report_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "computed_agent_weight" ADD CONSTRAINT "computed_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_agent_weight" ADD CONSTRAINT "user_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent"("key") ON DELETE no action ON UPDATE no action;
CREATE INDEX "key_index" ON "agent" USING btree ("key");
CREATE INDEX "comment_interaction_user_key_comment_id_index" ON "comment_interaction" USING btree ("user_key","comment_id");
CREATE INDEX "comment_item_type_item_id_index" ON "comment" USING btree ("item_type","item_id");
CREATE MATERIALIZED VIEW "public"."comment_digest" AS (select "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."user_name", "comment"."content", "comment"."created_at", count("comment_interaction"."reaction_type" = 'LIKE') as "likes", count("comment_interaction"."reaction_type" = 'DISLIKE') as "dislikes" from "comment" left join "comment_interaction" on "comment"."id" = "comment_interaction"."comment_id" where "comment"."deleted_at" is null group by "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."content", "comment"."created_at" order by "comment"."created_at" asc);
