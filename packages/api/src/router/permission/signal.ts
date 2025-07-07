import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, isNull } from "@torus-ts/db";
import { agentDemandSignalSchema } from "@torus-ts/db/schema";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";

import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const signalRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentDemandSignalSchema.findMany({
      where: and(isNull(agentDemandSignalSchema.deletedAt)),
    });
  }),
  byCreatorId: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentDemandSignalSchema.findMany({
        where: and(
          isNull(agentDemandSignalSchema.deletedAt),
          eq(agentDemandSignalSchema.agentKey, input.creatorId),
        ),
      });
    }),
  create: authenticatedProcedure
    .input(AGENT_DEMAND_SIGNAL_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const agentKey = ctx.sessionData.userKey;
      await ctx.db
        .insert(agentDemandSignalSchema)
        .values({ ...input, agentKey });
    }),
} satisfies TRPCRouterRecord;
