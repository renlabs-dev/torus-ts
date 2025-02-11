import { and, eq, isNull, max } from "@torus-ts/db";
import type { TRPCRouterRecord } from "@trpc/server";
import "@torus-ts/db/schema";
import { agentSchema, computedAgentWeightSchema } from "@torus-ts/db/schema";
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
} satisfies TRPCRouterRecord;
