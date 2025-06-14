import { and, isNull } from "@torus-ts/db";
import { agentDemandSignalSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";

export const signalRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentDemandSignalSchema.findMany({
      where: and(isNull(agentDemandSignalSchema.deletedAt)),
    });
  }),
  create: authenticatedProcedure
    .input(AGENT_DEMAND_SIGNAL_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(agentDemandSignalSchema).values({ ...input });
    }),
} satisfies TRPCRouterRecord;
