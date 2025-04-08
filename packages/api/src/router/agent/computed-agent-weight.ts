import { and, eq, isNull, max } from "@torus-ts/db";
import { agentSchema, computedAgentWeightSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

export const computedAgentWeightRouter = {
  // GET
  all: publicProcedure.query(async ({ ctx }) => {
    const lastBlock = ctx.db
      .select({ value: max(computedAgentWeightSchema.atBlock) })
      .from(computedAgentWeightSchema);
    return await ctx.db
      .select({
        agentKey: computedAgentWeightSchema.agentKey,
        agentName: agentSchema.name,
        computedWeight: computedAgentWeightSchema.computedWeight,
        percComputedWeight: computedAgentWeightSchema.percComputedWeight,
      })
      .from(computedAgentWeightSchema)
      .where(
        and(
          eq(computedAgentWeightSchema.atBlock, lastBlock),
          isNull(computedAgentWeightSchema.deletedAt),
        ),
      )
      .innerJoin(
        agentSchema,
        and(
          eq(computedAgentWeightSchema.agentKey, agentSchema.key),
          isNull(agentSchema.deletedAt),
        ),
      );
  }),
  byAgentKey: publicProcedure
    .input(z.object({ agentKey: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.computedAgentWeightSchema.findFirst({
        where: and(
          eq(computedAgentWeightSchema.agentKey, input.agentKey),
          isNull(computedAgentWeightSchema.deletedAt),
        ),
      });
    }),
} satisfies TRPCRouterRecord;
