CREATE TABLE "user_discord_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" varchar(20) NOT NULL,
	"user_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT null,
	CONSTRAINT "user_discord_info_discord_id_unique" UNIQUE("discord_id"),
	CONSTRAINT "discord_id_check" CHECK (LENGTH("user_discord_info"."discord_id") BETWEEN 17 AND 20 )
);
--> statement-breakpoint
ALTER TABLE "cadre_candidate" ADD CONSTRAINT "cadre_candidate_discord_id_unique" UNIQUE("discord_id");--> statement-breakpoint
ALTER TABLE "cadre" ADD CONSTRAINT "cadre_discord_id_unique" UNIQUE("discord_id");