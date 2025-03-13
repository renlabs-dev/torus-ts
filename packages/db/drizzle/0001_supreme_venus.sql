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
DROP MATERIALIZED VIEW "public"."comment_digest";--> statement-breakpoint
ALTER TABLE "cadre_candidate" DROP CONSTRAINT "discord_id_check";--> statement-breakpoint
ALTER TABLE "agent" DROP CONSTRAINT "percent_check";--> statement-breakpoint
ALTER TABLE "penalize_agent_votes" DROP CONSTRAINT "percent_check";--> statement-breakpoint
ALTER TABLE "cadre" DROP CONSTRAINT "discord_id_check";--> statement-breakpoint
DROP INDEX "key_index";--> statement-breakpoint
DROP INDEX "comment_item_type_item_id_user_key_index";--> statement-breakpoint
DROP INDEX "comment_interaction_user_key_comment_id_index";--> statement-breakpoint
ALTER TABLE "cadre_candidate" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "cadre_vote" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "agent" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "comment_report" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "comment_interaction" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "cadre_vote_history" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "computed_agent_weight" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "agent_report" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "governance_notification" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "user_agent_weight" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "whitelist_application" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "penalize_agent_votes" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "cadre" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "agent_application_vote" ALTER COLUMN "deleted_at" SET DEFAULT null;--> statement-breakpoint
CREATE INDEX "key_index" ON "agent" USING btree ("key");--> statement-breakpoint
CREATE INDEX "comment_item_type_item_id_user_key_index" ON "comment" USING btree ("item_type","item_id","user_key");--> statement-breakpoint
CREATE INDEX "comment_interaction_user_key_comment_id_index" ON "comment_interaction" USING btree ("user_key","comment_id");--> statement-breakpoint
ALTER TABLE "cadre_candidate" ADD CONSTRAINT "discord_id_check" CHECK (LENGTH("cadre_candidate"."discord_id") BETWEEN 17 AND 20 );--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "percent_check" CHECK ("agent"."weight_factor" >= 0 and "agent"."weight_factor" <= 100);--> statement-breakpoint
ALTER TABLE "penalize_agent_votes" ADD CONSTRAINT "percent_check" CHECK ("penalize_agent_votes"."penalty_factor" >= 0 and "penalize_agent_votes"."penalty_factor" <= 100);--> statement-breakpoint
ALTER TABLE "cadre" ADD CONSTRAINT "discord_id_check" CHECK (LENGTH("cadre"."discord_id") BETWEEN 17 AND 20 );--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."comment_digest" AS (select "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."user_name", "comment"."content", "comment"."created_at", sum(CASE WHEN "comment_interaction"."reaction_type" = 'LIKE' THEN 1 ELSE 0 END) as "likes", sum(CASE WHEN "comment_interaction"."reaction_type" = 'DISLIKE' THEN 1 ELSE 0 END) as "dislikes" from "comment" left join "comment_interaction" on "comment"."id" = "comment_interaction"."comment_id" where "comment"."deleted_at" is null group by "comment"."id", "comment"."item_type", "comment"."item_id", "comment"."user_key", "comment"."content", "comment"."created_at" order by "comment"."created_at" asc);