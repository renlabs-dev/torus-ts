import type { TRPCRouterRecord } from "@trpc/server";

import { eq, max } from "@torus-ts/db";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";
import { agentSchema, computedAgentWeightSchema } from "@torus-ts/db/schema";

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
        // sql`computed_module_weights.at_block = (SELECT MAX(computed_module_weights.at_block) FROM computed_module_weights)`,
        eq(computedAgentWeightSchema.atBlock, lastBlock),
      )
      .innerJoin(
        agentSchema,
        eq(computedAgentWeightSchema.agentKey, agentSchema.id),
      );
  }),
} satisfies TRPCRouterRecord;
