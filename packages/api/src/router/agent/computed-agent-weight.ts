import { publicProcedure } from "../../trpc";
import { eq, max, and, isNull } from "@torus-ts/db";
import { agentSchema, computedAgentWeightSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";

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
} satisfies TRPCRouterRecord;
