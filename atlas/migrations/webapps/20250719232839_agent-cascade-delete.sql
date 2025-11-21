-- Modify "agent_report" table
ALTER TABLE "public"."agent_report" DROP CONSTRAINT "agent_report_agent_key_agent_key_fk", ADD CONSTRAINT "agent_report_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE;
-- Modify "computed_agent_weight" table
ALTER TABLE "public"."computed_agent_weight" DROP CONSTRAINT "computed_agent_weight_agent_key_agent_key_fk", ADD CONSTRAINT "computed_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE;
-- Modify "user_agent_weight" table
ALTER TABLE "public"."user_agent_weight" DROP CONSTRAINT "user_agent_weight_agent_key_agent_key_fk", ADD CONSTRAINT "user_agent_weight_agent_key_agent_key_fk" FOREIGN KEY ("agent_key") REFERENCES "public"."agent" ("key") ON UPDATE NO ACTION ON DELETE CASCADE;
