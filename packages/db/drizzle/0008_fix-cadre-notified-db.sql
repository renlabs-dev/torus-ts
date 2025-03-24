-- Custom SQL migration file, put your code below! --
ALTER TABLE "cadre_candidate" ADD COLUMN "notified" BOOLEAN DEFAULT false;--> statement-breakpoint