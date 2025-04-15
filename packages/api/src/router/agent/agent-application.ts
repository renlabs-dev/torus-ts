import { agentApplicationSchema } from "@torus-ts/db/schema";
import { AGENT_APPLICATION_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure } from "../../trpc";

export const agentApplicationRouter = {
  create: authenticatedProcedure
    .input(AGENT_APPLICATION_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(agentApplicationSchema)
        .values({
          applicationKey: input.applicationKey,
          discordId: input.discordId,
          title: input.title,
          body: input.body,
          criteriaAgreement: input.criteriaAgreement,
        })
        .execute();

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
